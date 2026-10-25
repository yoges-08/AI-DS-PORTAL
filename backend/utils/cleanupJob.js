const { pool, getDbMode } = require('../config/db');

/**
 * Hourly cleanup job:
 * - Purges unverified student accounts older than 48 hours and frees up their whitelist claim
 * - Purges email_logs audit entries older than 90 days
 */
async function runPeriodicCleanup() {
  try {
    const isSqlite = getDbMode() === 'sqlite';

    // 1. Find unverified accounts older than 48 hours
    const staleSql = isSqlite
      ? `SELECT id FROM students WHERE email_verified = 0 AND created_at < datetime('now', '-48 hours')`
      : `SELECT id FROM students WHERE email_verified = 0 AND created_at < NOW() - INTERVAL 48 HOUR`;

    const [staleRows] = await pool.query(staleSql);

    if (staleRows && staleRows.length > 0) {
      const ids = staleRows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');

      // Free whitelist claims so students can re-register if needed
      await pool.query(
        `UPDATE student_whitelist SET is_claimed = 0, claimed_student_id = NULL WHERE claimed_student_id IN (${placeholders})`,
        ids
      );

      // Delete unverified students (email_verifications cascades)
      await pool.query(
        `DELETE FROM students WHERE id IN (${placeholders})`,
        ids
      );

      console.log(`[Cleanup Job] Cleaned up ${ids.length} unverified student account(s) older than 48 hours.`);
    }

    // 2. Delete email logs older than 90 days
    const logCleanupSql = isSqlite
      ? `DELETE FROM email_logs WHERE created_at < datetime('now', '-90 days')`
      : `DELETE FROM email_logs WHERE created_at < NOW() - INTERVAL 90 DAY`;

    await pool.query(logCleanupSql);
  } catch (err) {
    console.error('[Cleanup Job Error]:', err.message);
  }
}

function startPeriodicCleanup() {
  // Run once after boot (10 seconds delay)
  setTimeout(() => {
    runPeriodicCleanup();
  }, 10000).unref();

  // Run every 1 hour
  const ONE_HOUR = 60 * 60 * 1000;
  const timer = setInterval(() => {
    runPeriodicCleanup();
  }, ONE_HOUR);
  timer.unref();
}

module.exports = {
  runPeriodicCleanup,
  startPeriodicCleanup
};
