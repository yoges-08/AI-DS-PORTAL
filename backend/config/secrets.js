const crypto = require('crypto');

/**
 * Centralized Secrets & Security Configuration (SEC-06)
 * Enforces strong, unique secrets in production and generates safe ephemeral keys in development
 * if JWT_SECRET or COOKIE_SECRET are missing, completely eliminating shared/hardcoded secret fallbacks.
 */

const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
let cookieSecret = process.env.COOKIE_SECRET;

if (isProduction) {
  if (!jwtSecret || jwtSecret.includes('super_secret_jwt_key')) {
    console.error('FATAL: A secure, unique JWT_SECRET must be configured in production environment.');
    process.exit(1);
  }
  if (!cookieSecret || cookieSecret.includes('department_cookie_secret')) {
    console.error('FATAL: A secure, unique COOKIE_SECRET must be configured in production environment.');
    process.exit(1);
  }
} else {
  // Development fallback: generate random ephemeral keys rather than using static hardcoded strings
  if (!jwtSecret || jwtSecret.includes('super_secret_jwt_key')) {
    jwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Notice] JWT_SECRET was not set in backend/.env. Generated an ephemeral 256-bit key for this development session.');
  }

  if (!cookieSecret || cookieSecret.includes('department_cookie_secret')) {
    cookieSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Notice] COOKIE_SECRET was not set in backend/.env. Generated an ephemeral 256-bit key for this development session.');
  }
}

module.exports = {
  JWT_SECRET: jwtSecret,
  COOKIE_SECRET: cookieSecret,
  isProduction
};
