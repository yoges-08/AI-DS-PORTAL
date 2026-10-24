const { pool } = require('../config/db');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 5;

/**
 * Checks whether an action key is currently locked out
 * @param {string} key e.g. "verify:71762105001" or "login:student:71762105001"
 */
async function isLocked(key) {
  try {
    const [rows] = await pool.query(
      'SELECT locked_until_ms FROM auth_lockouts WHERE key_name = ?',
      [key]
    );
    return rows.length > 0 && Number(rows[0].locked_until_ms) > Date.now();
  } catch (err) {
    console.warn('[Lockout Check Warning]:', err.message);
    return false;
  }
}

/**
 * Records a failure attempt for a key, locking if maximum threshold exceeded
 * @param {string} key
 */
async function recordFailure(key) {
  const now = Date.now();
  try {
    const [rows] = await pool.query(
      'SELECT failures, first_attempt_ms FROM auth_lockouts WHERE key_name = ?',
      [key]
    );
    let failures = 1;
    let first = now;
    if (rows.length && (now - Number(rows[0].first_attempt_ms) < WINDOW_MS)) {
      failures = Number(rows[0].failures) + 1;
      first = Number(rows[0].first_attempt_ms);
    }
    const lockedUntil = failures >= MAX_FAILURES ? now + WINDOW_MS : 0;

    await pool.query(
      `REPLACE INTO auth_lockouts (key_name, failures, first_attempt_ms, locked_until_ms)
       VALUES (?, ?, ?, ?)`,
      [key, failures, first, lockedUntil]
    );
    return { failures, locked: lockedUntil > 0 };
  } catch (err) {
    console.warn('[Lockout Record Warning]:', err.message);
    return { failures: 1, locked: false };
  }
}

/**
 * Clears failures and unlock for a key upon successful authentication
 * @param {string} key
 */
async function clearFailures(key) {
  try {
    await pool.query('DELETE FROM auth_lockouts WHERE key_name = ?', [key]);
  } catch (err) {
    console.warn('[Lockout Clear Warning]:', err.message);
  }
}

module.exports = {
  isLocked,
  recordFailure,
  clearFailures,
  WINDOW_MS,
  MAX_FAILURES
};
