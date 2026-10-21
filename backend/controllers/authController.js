const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { validateRegisterNo } = require('../utils/validators');

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
      'SELECT id, register_no, name, dob, password, year, section, status, is_locked FROM students WHERE register_no = ?',
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
        section: student.section || null
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
      'SELECT id, username, password, name, email, department FROM admins WHERE username = ?',
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
        department: admin.department
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
 * Clears cookie
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
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

module.exports = {
  loginStudent,
  loginAdmin,
  logout,
  getCurrentUser
};
