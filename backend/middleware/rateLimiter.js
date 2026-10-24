const rateLimit = require('express-rate-limit');

/**
 * Composite key generator combining client IP and targeted account identifier.
 * Prevents NAT collateral denial-of-service on campus networks while preventing
 * single-account distributed brute force.
 */
const makeCompositeKey = (req) => {
  const id = req.body?.registerNo || req.body?.register_no || req.body?.username || req.body?.email || '';
  const cleanId = String(id).trim().toLowerCase().slice(0, 50);
  return `${req.ip}_${cleanId}`;
};

/**
 * Rate limiter for authentication endpoints to prevent brute-force attacks
 * Limits each IP/account combination to 15 login requests per 15-minute window
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: makeCompositeKey,
  message: {
    success: false,
    message: 'Too many login attempts for this account or IP. Please try again after 15 minutes.'
  }
});

/**
 * Dedicated rate limiter for resource-intensive Excel and PDF export endpoints (SEC-02).
 * Limits to 10 exports per minute per IP to prevent CPU/memory exhaustion.
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Export rate limit exceeded. Please wait a minute before requesting another Excel or PDF export.'
  }
});

/**
 * Dedicated rate limiter for heavy bulk operations: bulk import, bulk preview, bulk lock, bulk delete (SEC-02).
 * Limits to 15 bulk operations per minute per IP.
 */
const bulkActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bulk operation rate limit exceeded. Please wait a moment before trying again.'
  }
});

/**
 * Dedicated rate limiter for student live eligibility verification (Requirement C).
 * Strict 10 requests per 15-minute window per IP/account to prevent dictionary scanning.
 */
const verifyEligibilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: makeCompositeKey,
  message: {
    success: false,
    message: 'Too many verification attempts for this Register Number. Please try again after 15 minutes.'
  }
});

/**
 * Dedicated rate limiter for student self-registration endpoint (Requirement D).
 * Limits to 10 registration submissions per 15-minute window per IP/account.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: makeCompositeKey,
  message: {
    success: false,
    message: 'Too many registration attempts for this account. Please try again after 15 minutes.'
  }
});

/**
 * General API rate limiter for other endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Limit each IP to 200 requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

module.exports = {
  loginLimiter,
  verifyEligibilityLimiter,
  registerLimiter,
  exportLimiter,
  bulkActionLimiter,
  apiLimiter
};
