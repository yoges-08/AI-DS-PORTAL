const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { 
  validateRegisterNo, 
  cleanRegisterNo, 
  normalizeDob, 
  validateEmail, 
  validateStudentAge 
} = require('../utils/validators');
const { invalidateTokenCache } = require('../middleware/authMiddleware');
const { JWT_SECRET, isProduction } = require('../config/secrets');
const { logAdminAction } = require('../utils/auditLogger');
const { sendNow, sendInBackground, maskEmail, mailEnabled } = require('../utils/mailer');
const { verificationCode, accountCreated } = require('../utils/emailTemplates');
const { issueCode, checkCode } = require('../utils/emailVerification');
const { isLocked, recordFailure, clearFailures } = require('../utils/lockout');
const { checkPassword } = require('../utils/passwordPolicy');

// Dummy bcrypt hash for timing attack mitigation (cost factor 12)
const DUMMY_HASH = '$2b$12$cr1oA/k.M4Vhw16WcMib..0MuIGZshwoUFe3Rpmx7d9pAF/F6g.2a';
// O1 fix: Password verification helper supporting both raw and trimmed passwords
const verifyPassword = async (input, hash) => {
  const raw = String(input ?? '');
  if (await bcrypt.compare(raw, hash)) return true;
  const trimmed = raw.trim();
  return trimmed !== raw ? bcrypt.compare(trimmed, hash) : false;
};


// Cookie options: In production cross-domain setups (e.g. Vercel client -> Render API), SameSite='none' with Secure=true is required.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for students
  path: '/'
};

// S13 fix: Shorter session lifetime (12h) for administrative privileges
const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 12 * 60 * 60 * 1000, // 12 hours
  path: '/'
};

/**
 * Student eligibility verification against whitelist
 * POST /api/auth/student/verify-eligibility
 * Body: { registerNo, dob }
 */
const verifyStudentEligibility = async (req, res) => {
  try {
    const { registerNo, dob } = req.body;
    const cleanReg = cleanRegisterNo(registerNo);
    const normalizedDob = normalizeDob(dob);

    if (!cleanReg || !normalizedDob || !validateRegisterNo(cleanReg)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Register Number and Date of Birth are required.'
      });
    }

    const lockKey = `verify:${cleanReg}`;
    if (await isLocked(lockKey)) {
      return res.status(429).json({
        success: false,
        status: 'RATE_LIMITED',
        message: 'Too many verification attempts for this Register Number. Please try again after 15 minutes.'
      });
    }

    // Age validation: plausible student age 15 to 40
    if (!validateStudentAge(normalizedDob, 15, 40)) {
      await recordFailure(lockKey);
      return res.json({
        success: true,
        status: 'NO_MATCH'
      });
    }

    // Query whitelist
    const [whitelistRows] = await pool.query(
      'SELECT id, is_claimed, claimed_student_id FROM student_whitelist WHERE register_no = ? AND dob = ?',
      [cleanReg, normalizedDob]
    );

    // Also check students table
    const [studentRows] = await pool.query(
      'SELECT id FROM students WHERE register_no = ?',
      [cleanReg]
    );

    if (whitelistRows.length > 0) {
      const entry = whitelistRows[0];

      // Self-heal orphan claimed state: If the account was deleted from students table,
      // reset whitelist claimed state so the student can re-register!
      if (studentRows.length === 0 && (entry.is_claimed === 1 || entry.claimed_student_id !== null)) {
        await pool.query(
          'UPDATE student_whitelist SET is_claimed = 0, claimed_student_id = NULL WHERE id = ?',
          [entry.id]
        );
        entry.is_claimed = 0;
        entry.claimed_student_id = null;
      }

      // If active account exists in students table, notify user
      if (studentRows.length > 0 || entry.is_claimed === 1 || entry.claimed_student_id !== null) {
        await recordFailure(lockKey);
        return res.json({
          success: true,
          status: 'ALREADY_REGISTERED',
          message: 'An account is already registered for this Register Number. Please log in.'
        });
      }

      // Valid unclaimed match
      await clearFailures(lockKey);
      return res.json({
        success: true,
        status: 'MATCH'
      });
    }

    // No match: Record failure toward persistent lockout
    const failureRes = await recordFailure(lockKey);
    if (failureRes && failureRes.locked) {
      return res.status(429).json({
        success: false,
        status: 'RATE_LIMITED',
        message: 'Too many verification attempts for this Register Number. Please try again after 15 minutes.'
      });
    }
    return res.json({
      success: true,
      status: 'NO_MATCH'
    });
  } catch (error) {
    console.error('[verifyStudentEligibility Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify student eligibility. Please try again.'
    });
  }
};

/**
 * Student Self-Registration
 * POST /api/auth/student/register
 * Body: { name, registerNo, dob, email, password, claimCode }
 */
const registerStudent = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name, registerNo, dob, email, password, claimCode } = req.body;

    const trimmedName = String(name || '').trim();
    const cleanReg = cleanRegisterNo(registerNo);
    const normalizedDob = normalizeDob(dob);
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    // S3 fix: Enforce per-register-number lockout check on registration
    const lockKey = `verify:${cleanReg}`;
    if (await isLocked(lockKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts for this Register Number. Please try again after 15 minutes.'
      });
    }

    // Validate inputs
    if (!trimmedName || trimmedName.length > 100) {
      return res.status(400).json({ success: false, message: 'Full Name is required (up to 100 characters).' });
    }
    if (!cleanReg || !validateRegisterNo(cleanReg)) {
      return res.status(400).json({ success: false, message: 'Invalid Register Number format.' });
    }
    if (!normalizedDob) {
      return res.status(400).json({ success: false, message: 'Invalid Date of Birth format.' });
    }
    if (!validateStudentAge(normalizedDob, 15, 40)) {
      return res.status(400).json({ success: false, message: 'Date of Birth must represent a student age between 15 and 40.' });
    }
    if (!cleanEmail || !validateEmail(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    // S7 fix: Strict institutional password policy
    const pwError = checkPassword(rawPassword, { registerNo: cleanReg, dob: normalizedDob, minLength: 8 });
    if (pwError) {
      return res.status(400).json({ success: false, message: pwError });
    }

    // Begin atomic transaction
    await conn.beginTransaction();

    // 1. Re-verify whitelist record with row lock FOR UPDATE
    const [whitelistRows] = await conn.query(
      'SELECT id, is_claimed, claimed_student_id, claim_code_hash FROM student_whitelist WHERE register_no = ? AND dob = ? FOR UPDATE',
      [cleanReg, normalizedDob]
    );

    if (whitelistRows.length === 0) {
      await conn.rollback();
      await recordFailure(lockKey);
      return res.status(400).json({
        success: false,
        message: 'Registration details could not be verified with department records.'
      });
    }

    const whitelistEntry = whitelistRows[0];
    if (whitelistEntry.is_claimed === 1 || whitelistEntry.claimed_student_id !== null) {
      // Check if student actually exists in students table
      const [realStudent] = await conn.query(
        'SELECT id FROM students WHERE LOWER(register_no) = LOWER(?)',
        [cleanReg]
      );
      if (realStudent.length > 0) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          message: 'An account has already been registered for this student. Please log in.'
        });
      } else {
        // Orphaned claim state from previously deleted student: reset whitelist entry
        await conn.query(
          'UPDATE student_whitelist SET is_claimed = 0, claimed_student_id = NULL WHERE id = ?',
          [whitelistEntry.id]
        );
        whitelistEntry.is_claimed = 0;
        whitelistEntry.claimed_student_id = null;
      }
    }

    // S3 fix (Option 1): If whitelist record requires claim code, verify it
    if (whitelistEntry.claim_code_hash) {
      const userCode = String(claimCode || '').trim().toUpperCase();
      const isClaimValid = await bcrypt.compare(userCode, whitelistEntry.claim_code_hash);
      if (!isClaimValid) {
        await conn.rollback();
        await recordFailure(lockKey);
        return res.status(400).json({
          success: false,
          message: 'Invalid department one-time claim code. Please check with your department coordinator.'
        });
      }
    }

    // 2. Double-check students table for register number
    const [existingStudent] = await conn.query(
      'SELECT id FROM students WHERE register_no = ? FOR UPDATE',
      [cleanReg]
    );
    if (existingStudent.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account has already been registered for this student. Please log in.'
      });
    }

    // 3. Check email uniqueness across students
    const [existingEmail] = await conn.query(
      'SELECT id FROM students WHERE LOWER(email) = LOWER(?)',
      [cleanEmail]
    );
    if (existingEmail.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This email address is already in use by another student account.'
      });
    }

    // 4. Hash password with bcrypt cost 12
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const needVerify = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && mailEnabled();

    // 5. Insert new student account
    const [insertResult] = await conn.query(
      `INSERT INTO students (register_no, name, dob, email, password, status, is_locked, token_version, must_change_password, email_verified)
       VALUES (?, ?, ?, ?, ?, 'DRAFT', 0, 1, 0, ?)`,
      [cleanReg, trimmedName, normalizedDob, cleanEmail, hashedPassword, needVerify ? 0 : 1]
    );
    const newStudentId = insertResult.insertId;

    // 6. Mark whitelist entry as claimed
    await conn.query(
      'UPDATE student_whitelist SET is_claimed = 1, claimed_student_id = ? WHERE id = ?',
      [newStudentId, whitelistEntry.id]
    );

    await conn.commit();

    // S3 fix: Clear failures on successful registration
    await clearFailures(lockKey);

    // 7. Audit log (Never log password!)
    await logAdminAction({
      adminUsername: 'SYSTEM',
      action: 'STUDENT_SELF_REGISTER',
      studentId: newStudentId,
      studentRegNo: cleanReg,
      details: `Student ${trimmedName} (${cleanReg}) self-registered successfully. Verification required: ${needVerify}`,
      ipAddress: req.ip
    });

    if (needVerify) {
      // Issue 6-digit code and send E1 synchronously
      const issueRes = await issueCode(newStudentId, cleanEmail);
      let emailSent = false;
      if (issueRes.code) {
        const tpl = verificationCode({ name: trimmedName, code: issueRes.code, validMinutes: 10 });
        const emailRes = await sendNow({
          toEmail: cleanEmail,
          toName: trimmedName,
          subject: tpl.subject,
          htmlContent: tpl.html,
          studentId: newStudentId,
          template: 'verificationCode'
        });
        emailSent = Boolean(emailRes.success);
      }

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        message: 'Registration successful! A 6-digit verification code has been sent to your email address.',
        studentId: newStudentId,
        emailMasked: maskEmail(cleanEmail),
        emailSent
      });
    }

    // 8. Generate JWT session and set httpOnly cookie (when verification is skipped)
    const token = jwt.sign(
      {
        id: newStudentId,
        role: 'STUDENT',
        registerNo: cleanReg,
        name: trimmedName,
        year: null,
        section: null,
        tokenVersion: 1
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    // Return token in payload for cross-domain Bearer auth fallback
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to the Student Portal!',
      user: {
        id: newStudentId,
        role: 'STUDENT',
        registerNo: cleanReg,
        name: trimmedName,
        email: cleanEmail,
        year: null,
        section: null,
        status: 'DRAFT',
        isLocked: false,
        mustChangePassword: false
      }
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rbErr) {}
    console.error('[registerStudent Error]:', error);
    if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || String(error.message).includes('UNIQUE constraint failed: students.email'))) {
      return res.status(409).json({
        success: false,
        message: 'That email address is already used by another account.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during account creation. Please try again.'
    });
  } finally {
    try {
      conn.release();
    } catch (relErr) {}
  }
};

/**
 * Student Login
 * Username: Register Number
 * Password: User-chosen password
 */
const loginStudent = async (req, res) => {
  try {
    const { registerNo, password } = req.body;

    if (!registerNo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Register Number and Password are required.'
      });
    }

    const cleanReg = cleanRegisterNo(registerNo);
    if (!cleanReg || !validateRegisterNo(cleanReg)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    // S7 fix: Per-account lockout check
    const lockKey = `login:student:${cleanReg}`;
    if (await isLocked(lockKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts for this account. Please try again after 15 minutes.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, register_no, name, dob, email, password, year, section, status, is_locked, token_version, must_change_password, email_verified FROM students WHERE register_no = ?',
      [cleanReg]
    );

    // S7 fix: Timing leak prevention using dummy bcrypt hash
    if (rows.length === 0) {
      await bcrypt.compare(String(password), DUMMY_HASH);
      await recordFailure(lockKey);
    await logAdminAction({ adminUsername: 'SYSTEM', action: 'STUDENT_LOGIN_FAILED', studentRegNo: cleanReg, details: 'Failed student login attempt', ipAddress: req.ip });
    return res.status(401).json({ success: false, message: 'Invalid Register Number or Password.' });
    }

    const student = rows[0];
    if (Buffer.byteLength(String(password), 'utf8') > 72) return res.status(401).json({ success: false, message: 'Invalid Register Number or Password.' });
    const isMatch = await verifyPassword(password, student.password);

    if (!isMatch) {
      await recordFailure(lockKey);
    await logAdminAction({ adminUsername: 'SYSTEM', action: 'STUDENT_LOGIN_FAILED', studentRegNo: cleanReg, details: 'Failed student login attempt', ipAddress: req.ip });
    return res.status(401).json({ success: false, message: 'Invalid Register Number or Password.' });
    }

    // S7 fix: Clear login failures on valid authentication
    await clearFailures(lockKey);

    if (student.email_verified === 0 && process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && mailEnabled()) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address has not been verified yet. Please enter the verification code sent to your email.',
        studentId: student.id,
        emailMasked: maskEmail(student.email)
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        tokenVersion: student.token_version || 1
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    // B2 fix: Log successful student login
    await logAdminAction({
      adminUsername: 'SYSTEM',
      action: 'STUDENT_LOGIN',
      studentId: student.id,
      studentRegNo: student.register_no,
      details: 'Student login successful',
      ipAddress: req.ip
    });

    // Return token in payload for cross-domain Bearer auth fallback
    return res.json({
      success: true,
      message: 'Login successful.',
      mustChangePassword: Boolean(student.must_change_password),
      user: {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        email: student.email || null,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        status: student.status,
        isLocked: Boolean(student.is_locked),
        mustChangePassword: Boolean(student.must_change_password)
      }
    });
  } catch (error) {
    console.error('[loginStudent Error]:', error);
    // S11 fix: Mask database credentials and server internal details
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again.'
    });
  }
};

/**
 * Admin / Faculty Login
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and Password are required.'
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // S7 fix: Account lockout on admin login
    const lockKey = `login:admin:${cleanUsername}`;
    if (await isLocked(lockKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts for this administrative account. Please try again after 15 minutes.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password, name, email, department, token_version FROM admins WHERE LOWER(username) = ?',
      [cleanUsername]
    );

    // S7 fix: Timing leak prevention using dummy bcrypt hash
    if (rows.length === 0) {
      await bcrypt.compare(String(password), DUMMY_HASH);
      await recordFailure(lockKey);
      await logAdminAction({
        adminUsername: String(cleanUsername || '').slice(0, 50),
        action: 'ADMIN_LOGIN_FAILED',
        details: 'Failed admin login attempt (unknown username)',
        ipAddress: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin username or password.'
      });
    }

    const admin = rows[0];
    if (Buffer.byteLength(String(password), 'utf8') > 72) return res.status(401).json({ success: false, message: 'Invalid administrative username or password.' });
    const isMatch = await verifyPassword(password, admin.password);

    if (!isMatch) {
      await recordFailure(lockKey);
      await logAdminAction({
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'ADMIN_LOGIN_FAILED',
        details: 'Failed admin login attempt (invalid password)',
        ipAddress: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin username or password.'
      });
    }

    // Clear failures on success
    await clearFailures(lockKey);

    // S13 fix: Admin token TTL restricted to 12 hours
    const token = jwt.sign(
      {
        id: admin.id,
        role: 'ADMIN',
        username: admin.username,
        name: admin.name,
        department: admin.department,
        tokenVersion: admin.token_version || 1
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, ADMIN_COOKIE_OPTIONS);

    // B2 fix: Log successful admin login
    await logAdminAction({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'ADMIN_LOGIN',
      details: `Admin ${admin.username} logged in successfully`,
      ipAddress: req.ip
    });

    // Return token in payload for cross-domain Bearer auth fallback
    return res.json({
      success: true,
      message: 'Admin login successful.',
      user: {
        id: admin.id,
        role: 'ADMIN',
        username: admin.username,
        name: admin.name,
        email: admin.email,
        department: admin.department
      }
    });
  } catch (error) {
    console.error('[loginAdmin Error]:', error);
    // S11 fix: Mask database credentials and server internal details
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during admin login. Please try again.'
    });
  }
};

/**
 * Logout
 * Clears cookie and increments token_version to invalidate existing JWT sessions
 */
const logout = async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        if (decoded?.id && decoded?.role && ['ADMIN', 'STUDENT'].includes(decoded.role)) {
          const table = decoded.role === 'ADMIN' ? 'admins' : 'students';
          await pool.query(
            `UPDATE ${table} SET token_version = COALESCE(token_version, 1) + 1 WHERE id = ?`,
            [decoded.id]
          ).catch(() => {});
          invalidateTokenCache(decoded.role, decoded.id);
        }
      } catch (jwtErr) {
        // Token was invalid or expired, continue to clear cookie
      }
    }
  } catch (e) {
    // ignore
  }

  res.clearCookie('token', COOKIE_OPTIONS);
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * Get current authenticated user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (req.user.role === 'ADMIN') {
      const [rows] = await pool.query(
        'SELECT id, username, name, email, department FROM admins WHERE id = ?',
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin account not found' });
      }
      return res.json({
        success: true,
        user: { ...rows[0], role: 'ADMIN' }
      });
    }

    if (req.user.role === 'STUDENT') {
      const [rows] = await pool.query(
        `SELECT id, register_no, name, dob, year, section, status, is_locked, 
                submission_date, rejection_reason, declaration_accepted, photo_path 
         FROM students WHERE id = ?`,
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Student account not found' });
      }
      const s = rows[0];
      return res.json({
        success: true,
        user: {
          id: s.id,
          role: 'STUDENT',
          registerNo: s.register_no,
          name: s.name,
          dob: s.dob,
          year: s.year !== null && s.year !== undefined ? s.year : null,
          section: s.section || null,
          status: s.status,
          isLocked: Boolean(s.is_locked),
          submissionDate: s.submission_date,
          rejectionReason: s.rejection_reason,
          declarationAccepted: Boolean(s.declaration_accepted),
          photoPath: s.photo_path
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Unknown role' });
  } catch (error) {
    console.error('[getCurrentUser Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user state.' });
  }
};

/**
 * Self-service password change for authenticated users (Faculty/Admin or Student)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    const { id, role } = req.user;

    // S7 fix: Strict institutional password policy validation
    const pwPolicyErr = checkPassword(newPassword, { minLength: role === 'ADMIN' ? 12 : 8 });
    if (pwPolicyErr) {
      return res.status(400).json({ success: false, message: pwPolicyErr });
    }

    if (role === 'ADMIN') {
      const [admins] = await pool.query('SELECT password FROM admins WHERE id = ?', [id]);
      if (admins.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }
      const isMatch = await verifyPassword(currentPassword, admins[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      const hashed = await bcrypt.hash(String(newPassword), 12);
      await pool.query(
        'UPDATE admins SET password = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?',
        [hashed, id]
      );
      invalidateTokenCache('ADMIN', id);
      return res.json({ success: true, message: 'Password updated successfully. Existing sessions have been revoked.' });
    } else if (role === 'STUDENT') {
      const [students] = await pool.query('SELECT password, register_no, dob FROM students WHERE id = ?', [id]);
      if (students.length === 0) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }
      const isMatch = await verifyPassword(currentPassword, students[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }

      // Check against student register number and dob
      const studentPwErr = checkPassword(newPassword, {
        registerNo: students[0].register_no,
        dob: students[0].dob,
        minLength: 8
      });
      if (studentPwErr) {
        return res.status(400).json({ success: false, message: studentPwErr });
      }

      const hashed = await bcrypt.hash(String(newPassword), 12);
      await pool.query(
        'UPDATE students SET password = ?, token_version = COALESCE(token_version, 1) + 1, must_change_password = 0 WHERE id = ?',
        [hashed, id]
      );
      invalidateTokenCache('STUDENT', id);
      return res.json({ success: true, message: 'Password updated successfully. Existing sessions have been revoked.' });
    }

    return res.status(400).json({ success: false, message: 'Unknown role.' });
  } catch (error) {
    console.error('[changePassword Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};


/**
 * Verify Student Email with 6-Digit Code
 * POST /api/auth/student/verify-email
 * Body: { studentId, code }
 */
const verifyEmail = async (req, res) => {
  try {
    const { studentId, code } = req.body;
    if (!studentId || !code) {
      return res.status(400).json({ success: false, message: 'Student ID and verification code are required.' });
    }

    const result = await checkCode(studentId, code);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        code: result.error,
        message: result.message,
        remainingAttempts: result.remainingAttempts
      });
    }

    // Code verified! Fetch student to issue session token
    const [rows] = await pool.query(
      'SELECT id, register_no, name, dob, email, year, section, status, is_locked, token_version, must_change_password FROM students WHERE id = ?',
      [studentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }
    const student = rows[0];

    // Issue JWT session cookie
    const token = jwt.sign(
      {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        tokenVersion: student.token_version || 1
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    // Send E2 ("Account Created / Activated") in background
    const tpl = accountCreated({ name: student.name, registerNo: student.register_no });
    sendInBackground({
      toEmail: student.email,
      toName: student.name,
      subject: tpl.subject,
      htmlContent: tpl.html,
      studentId: student.id,
      template: 'accountCreated'
    });

    await logAdminAction({
      adminUsername: 'SYSTEM',
      action: 'STUDENT_EMAIL_VERIFIED',
      studentId: student.id,
      studentRegNo: student.register_no,
      details: 'Student email verified and session activated.',
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Email verified successfully! Welcome to the Student Portal.',
      user: {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        email: student.email || null,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        status: student.status,
        isLocked: Boolean(student.is_locked),
        mustChangePassword: Boolean(student.must_change_password)
      }
    });
  } catch (error) {
    console.error('[verifyEmail Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify code. Please try again.' });
  }
};

/**
 * Resend 6-Digit Email Verification Code
 * POST /api/auth/student/resend-code
 * Body: { studentId }
 */
const resendVerificationCode = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, email_verified FROM students WHERE id = ?',
      [studentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }
    const student = rows[0];

    if (student.email_verified === 1) {
      return res.status(400).json({ success: false, message: 'This student email is already verified. Please log in.' });
    }

    const issueRes = await issueCode(student.id, student.email);
    if (issueRes.error) {
      return res.status(429).json({
        success: false,
        code: issueRes.error,
        message: issueRes.message,
        waitSeconds: issueRes.waitSeconds
      });
    }

    // Send email E1 synchronously
    const tpl = verificationCode({ name: student.name, code: issueRes.code, validMinutes: 10 });
    const emailRes = await sendNow({
      toEmail: student.email,
      toName: student.name,
      subject: tpl.subject,
      htmlContent: tpl.html,
      studentId: student.id,
      template: 'verificationCode'
    });

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      emailMasked: maskEmail(student.email),
      emailSent: Boolean(emailRes.success)
    });
  } catch (error) {
    console.error('[resendVerificationCode Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification code. Please try again.' });
  }
};

/**
 * Change Pending Registration Email
 * POST /api/auth/student/change-pending-email
 * Body: { studentId, newEmail }
 */
const changePendingEmail = async (req, res) => {
  try {
    const { studentId, newEmail } = req.body;
    if (!studentId || !newEmail) {
      return res.status(400).json({ success: false, message: 'Student ID and new email address are required.' });
    }
    const cleanEmail = String(newEmail).trim().toLowerCase();
    if (!validateEmail(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, email_verified FROM students WHERE id = ?',
      [studentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }
    const student = rows[0];

    if (student.email_verified === 1) {
      return res.status(400).json({ success: false, message: 'Cannot change email for an already-verified account.' });
    }

    // Check if new email is in use
    const [dupRows] = await pool.query(
      'SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND id != ?',
      [cleanEmail, studentId]
    );
    if (dupRows.length > 0) {
      return res.status(409).json({ success: false, message: 'This email address is already in use by another student.' });
    }

    // Update email on student record
    await pool.query('UPDATE students SET email = ? WHERE id = ?', [cleanEmail, studentId]);

    // Issue new code
    const issueRes = await issueCode(student.id, cleanEmail);
    if (issueRes.error) {
      return res.status(429).json({
        success: false,
        code: issueRes.error,
        message: issueRes.message,
        waitSeconds: issueRes.waitSeconds
      });
    }

    // Send email E1 synchronously
    const tpl = verificationCode({ name: student.name, code: issueRes.code, validMinutes: 10 });
    const emailRes = await sendNow({
      toEmail: cleanEmail,
      toName: student.name,
      subject: tpl.subject,
      htmlContent: tpl.html,
      studentId: student.id,
      template: 'verificationCode'
    });

    return res.json({
      success: true,
      message: 'Email updated successfully and a new verification code has been sent.',
      emailMasked: maskEmail(cleanEmail),
      emailSent: Boolean(emailRes.success)
    });
  } catch (error) {
    console.error('[changePendingEmail Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email. Please try again.' });
  }
};

module.exports = {
  verifyEmail,
  resendVerificationCode,
  changePendingEmail,
  loginStudent,
  loginAdmin,
  logout,
  getCurrentUser,
  changePassword,
  verifyStudentEligibility,
  registerStudent
};
