const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_aids_portal_2026_department_system';

/**
 * Verify JWT from httpOnly cookie or Authorization header
 */
const authenticateToken = (req, res, next) => {
  // Support httpOnly cookie first, then fall back to Bearer header
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
};

/**
 * Restrict endpoint to Admin role only
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.'
    });
  }
  next();
};

/**
 * Restrict endpoint to Student role only
 */
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Student access only.'
    });
  }
  next();
};

/**
 * Ensure students can only access or modify their own record
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  const targetId = req.params?.id || req.body?.studentId;
  const requestedStudentId = targetId ? parseInt(targetId, 10) : null;
  if (requestedStudentId && req.user.id !== requestedStudentId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: You can only access and modify your own student record.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireSelfOrAdmin
};
