let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { validateRegisterNo } = require('../utils/validators');
const { invalidateTokenCache } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_aids_portal_2026_department_system';
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  // 'none' allows cross-domain cookies between Vercel frontend and Render backend
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Student Login
 * Username: Register Number
 * Password: DOB in DDMMYYYY format
 */
const loginStudent = async (req, res) => {
  try {
    const { registerNo, password } = req.body;

    if (!registerNo || !password) {
      return res.status(400).json({
        success: false,
        message: 'Register Number and Password (DOB in DDMMYYYY) are required.'
      });
    }

    if (!validateRegisterNo(registerNo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, register_no, name, dob, password, year, section, status, is_locked, token_version FROM students WHERE register_no = ?',
      [registerNo.trim()]
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
        message: 'Invalid Register Number or Password. Password must be your DOB (DDMMYYYY).'
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
      user: {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        status: student.status,
        isLocked: Boolean(student.is_locked)
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
        'UPDATE students SET password = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?',
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
  changePassword
};
