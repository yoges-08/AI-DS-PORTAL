let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
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

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  // 'none' allows cross-domain cookies between Vercel frontend and Render backend
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Per-register-number sliding failure tracker to prevent online DOB dictionary attacks (Requirement C)
// Map<cleanRegNo, { failures: number, lockedUntil: number, firstAttempt: number }>
const regNoLockouts = new Map();

// Periodic cleanup of stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [regNo, data] of regNoLockouts.entries()) {
    if (now > data.lockedUntil && now - data.firstAttempt > 15 * 60 * 1000) {
      regNoLockouts.delete(regNo);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Handle verification failure counting and lockout logic
 */
const handleVerificationFailure = async (req, res, cleanReg) => {
  const now = Date.now();
  const current = regNoLockouts.get(cleanReg) || { failures: 0, lockedUntil: 0, firstAttempt: now };
  if (now - current.firstAttempt > 15 * 60 * 1000) {
    current.failures = 0;
    current.firstAttempt = now;
  }
  current.failures += 1;

  if (current.failures >= 5) {
    current.lockedUntil = now + 15 * 60 * 1000;
    regNoLockouts.set(cleanReg, current);

    // Log ONLY lockouts to audit log (Requirement C)
    await logAdminAction({
      adminUsername: 'SYSTEM',
      action: 'VERIFICATION_LOCKOUT',
      studentRegNo: cleanReg,
      details: `Register number ${cleanReg} locked out for 15 minutes after 5 failed eligibility verification attempts.`,
      ipAddress: req.ip
    });

    return res.status(429).json({
      success: false,
      status: 'RATE_LIMITED',
      message: 'Too many verification attempts for this Register Number. Please try again after 15 minutes.'
    });
  }

  regNoLockouts.set(cleanReg, current);
  return res.json({
    success: true,
    status: 'NO_MATCH'
  });
};

/**
 * Live student eligibility verification against whitelist (Requirement C)
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

    const now = Date.now();
    const lockout = regNoLockouts.get(cleanReg);
    if (lockout && now < lockout.lockedUntil) {
      return res.status(429).json({
        success: false,
        status: 'RATE_LIMITED',
        message: 'Too many verification attempts for this Register Number. Please try again after 15 minutes.'
      });
    }

    // Age validation: plausible student age 15 to 40
    if (!validateStudentAge(normalizedDob, 15, 40)) {
      return handleVerificationFailure(req, res, cleanReg);
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
      if (entry.is_claimed === 1 || entry.claimed_student_id !== null || studentRows.length > 0) {
        regNoLockouts.delete(cleanReg);
        return res.json({
          success: true,
          status: 'ALREADY_REGISTERED'
        });
      }

      // Valid unclaimed match
      regNoLockouts.delete(cleanReg);
      return res.json({
        success: true,
        status: 'MATCH'
      });
    }

    // No match: either wrong DOB or unknown register number (indistinguishable)
    return handleVerificationFailure(req, res, cleanReg);
  } catch (error) {
    console.error('[verifyStudentEligibility Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify student eligibility. Please try again.'
    });
  }
};

/**
 * Student Self-Registration (Requirement D)
 * POST /api/auth/student/register
 * Body: { name, registerNo, dob, email, password }
 */
const registerStudent = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name, registerNo, dob, email, password } = req.body;

    const trimmedName = String(name || '').trim();
    const cleanReg = cleanRegisterNo(registerNo);
    const normalizedDob = normalizeDob(dob);
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

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
    if (!rawPassword || rawPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Begin atomic transaction
    await conn.beginTransaction();

    // 1. Re-verify whitelist record with row lock FOR UPDATE
    const [whitelistRows] = await conn.query(
      'SELECT id, is_claimed, claimed_student_id FROM student_whitelist WHERE register_no = ? AND dob = ? FOR UPDATE',
      [cleanReg, normalizedDob]
    );

    if (whitelistRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Register Number and Date of Birth do not match department records.'
      });
    }

    const whitelistEntry = whitelistRows[0];
    if (whitelistEntry.is_claimed === 1 || whitelistEntry.claimed_student_id !== null) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account has already been registered for this student. Please log in.'
      });
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

    // 4. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 5. Insert new student account
    const [insertResult] = await conn.query(
      `INSERT INTO students (register_no, name, dob, email, password, status, is_locked, token_version, must_change_password)
       VALUES (?, ?, ?, ?, ?, 'DRAFT', 0, 1, 0)`,
      [cleanReg, trimmedName, normalizedDob, cleanEmail, hashedPassword]
    );
    const newStudentId = insertResult.insertId;

    // 6. Mark whitelist entry as claimed
    await conn.query(
      'UPDATE student_whitelist SET is_claimed = 1, claimed_student_id = ? WHERE id = ?',
      [newStudentId, whitelistEntry.id]
    );

    await conn.commit();

    // 7. Audit log (Never log password!)
    await logAdminAction({
      adminUsername: 'SYSTEM',
      action: 'STUDENT_SELF_REGISTER',
      studentId: newStudentId,
      studentRegNo: cleanReg,
      details: `Student ${trimmedName} (${cleanReg}) self-registered successfully.`,
      ipAddress: req.ip
    });

    // 8. Generate JWT session and set cookie
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

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to the Student Portal!',
      token,
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
 * Password: User-chosen password (Requirement E)
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

    const [rows] = await pool.query(
      'SELECT id, register_no, name, dob, email, password, year, section, status, is_locked, token_version, must_change_password FROM students WHERE register_no = ?',
      [cleanReg]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Register Number or Password.'
      });
    }

    const student = rows[0];
    const isMatch = await bcrypt.compare(String(password).trim(), student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Register Number or Password.'
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

    // Set cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Login successful.',
      token, // Expose token for cross-domain Bearer authorization (e.g. Vercel -> Render)
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
    let message = 'An error occurred during student login. Please try again.';
    if (error.code === 'ECONNREFUSED') {
      message = 'Database connection failed: MySQL server is not running on localhost:3306. Please start MySQL (e.g. start MySQL in XAMPP or MySQL Service) and run: npm run seed';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      message = 'Database "aids_portal" does not exist in MySQL. Please run: npm run seed in backend folder.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      message = 'Database tables not found. Please run: npm run seed in backend folder.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'MySQL access denied. Please verify DB_PASSWORD in backend/.env.';
    }
    return res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Admin Login
 * Username and Password
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

    const [rows] = await pool.query(
      'SELECT id, username, password, name, email, department, token_version FROM admins WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin username or password.'
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(String(password).trim(), admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin username or password.'
      });
    }

    // Generate JWT
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
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Admin login successful.',
      token, // Expose token for cross-domain Bearer authorization (e.g. Vercel -> Render)
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
    let message = 'An error occurred during admin login. Please try again.';
    if (error.code === 'ECONNREFUSED') {
      message = 'Database connection failed: MySQL server is not running on localhost:3306. Please start MySQL and run: npm run seed';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      message = 'Database "aids_portal" does not exist in MySQL. Please run: npm run seed in backend folder.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      message = 'Database tables not found. Please run: npm run seed in backend folder.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'MySQL access denied. Please verify DB_PASSWORD in backend/.env.';
    }
    return res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Logout
 * Clears cookie and increments token_version to invalidate existing JWT sessions (SEC-03)
 */
const logout = async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id && decoded?.role) {
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

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const { id, role } = req.user;

    if (role === 'ADMIN') {
      const [admins] = await pool.query('SELECT password FROM admins WHERE id = ?', [id]);
      if (admins.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }
      const isMatch = await bcrypt.compare(String(currentPassword).trim(), admins[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      const hashed = await bcrypt.hash(String(newPassword).trim(), 10);
      await pool.query(
        'UPDATE admins SET password = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?',
        [hashed, id]
      );
      invalidateTokenCache('ADMIN', id);
      return res.json({ success: true, message: 'Password updated successfully. Existing sessions have been revoked.' });
    } else if (role === 'STUDENT') {
      const [students] = await pool.query('SELECT password FROM students WHERE id = ?', [id]);
      if (students.length === 0) {
        return res.status(404).json({ success: false, message: 'Student account not found.' });
      }
      const isMatch = await bcrypt.compare(String(currentPassword).trim(), students[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      const hashed = await bcrypt.hash(String(newPassword).trim(), 10);
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

module.exports = {
  loginStudent,
  loginAdmin,
  logout,
  getCurrentUser,
  changePassword,
  verifyStudentEligibility,
  registerStudent
};
