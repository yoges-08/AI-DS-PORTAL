const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints to prevent brute-force attacks
 * Limits each IP to 15 login requests per 15-minute window
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.'
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
  exportLimiter,
  bulkActionLimiter,
  apiLimiter
};
