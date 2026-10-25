const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../config/secrets');

// In-memory cache for token versions to avoid excessive database queries (TTL 15 seconds)
const tokenVersionCache = new Map();
const PASSWORD_CHANGE_ALLOWED = new Set([
  '/api/auth/me',
  '/api/auth/change-password',
  '/api/auth/logout'
]);


function invalidateTokenCache(role, id) {
  tokenVersionCache.delete(`${role}:${id}`);
}

/**
 * Verify JWT from httpOnly cookie or Authorization header.
 * Note: URL query parameter token acceptance has been removed to prevent token leakage in logs/history (SEC-04).
 */
const authenticateToken = async (req, res, next) => {
  // Support httpOnly cookie first, then Bearer header
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
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // S13 fix: Require valid payload fields and whitelisted role
    if (decoded.tokenVersion === undefined || !decoded.id || !decoded.role || !['ADMIN', 'STUDENT'].includes(decoded.role)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session structure. Please log in again.'
      });
    }

    req.user = decoded;

    // Invalidate tokens upon password change or logout via token_version check
    const cacheKey = `${decoded.role}:${decoded.id}`;
    const now = Date.now();
    let currentVersion;
    let isLocked = 0;
    let mustChangePassword = 0;

    const cached = tokenVersionCache.get(cacheKey);
    if (cached && (now - cached.cachedAt < 5000)) { // 5s TTL
      currentVersion = cached.version;
      isLocked = cached.isLocked || 0;
      mustChangePassword = cached.mustChangePassword || 0;
    } else {
      const [rows] = await pool.query(
        decoded.role === 'STUDENT'
          ? `SELECT token_version, is_locked, must_change_password FROM students WHERE id = ?`
          : `SELECT token_version FROM admins WHERE id = ?`,
        [decoded.id]
      );
      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Account no longer exists.' });
      }
      currentVersion = rows[0].token_version || 1;
      isLocked = decoded.role === 'STUDENT' ? (rows[0].is_locked || 0) : 0;
      mustChangePassword = decoded.role === 'STUDENT' ? (rows[0].must_change_password || 0) : 0;
      tokenVersionCache.set(cacheKey, { version: currentVersion, isLocked, mustChangePassword, cachedAt: now });
    }

    // Attach user lock and password status without blanket session termination (SEC-CRIT-01)
    req.user.isLocked = Boolean(isLocked);
    req.user.mustChangePassword = Boolean(mustChangePassword);

    // O2 fix: Server-side enforcement of password change for reset/temporary credentials
    if (decoded.role === 'STUDENT' && mustChangePassword === 1) {
      const pathOnly = (req.originalUrl || req.url).split('?')[0];
      if (!PASSWORD_CHANGE_ALLOWED.has(pathOnly)) {
        return res.status(403).json({
          success: false,
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your temporary password before accessing portal features.'
        });
      }
    }

    if (decoded.tokenVersion !== currentVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated due to a recent password change or logout. Please log in again.'
      });
    }

    next();
  } catch (error) {
    // B2 fix: Return 401 for expired or invalid authentication token
    return res.status(401).json({
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
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role === 'STUDENT') {
    const targetId = req.params?.id || req.body?.studentId;
    if (targetId) {
      const requestedStudentId = parseInt(targetId, 10);
      if (isNaN(requestedStudentId) || req.user.id !== requestedStudentId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only access and modify your own student record.'
        });
      }
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Invalid user role.'
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireSelfOrAdmin,
  invalidateTokenCache
};
