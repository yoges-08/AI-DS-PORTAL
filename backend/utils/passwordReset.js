const crypto = require('crypto');
const { pool } = require('../config/db');

let tableChecked = false;

/**
 * Ensure password_resets table exists in SQLite or MySQL/TiDB
 */
async function ensurePasswordResetsTable() {
  if (tableChecked) return;
  try {
    const { getDbMode } = require('../config/db');
    const isSqlite = typeof getDbMode === 'function' && getDbMode() === 'sqlite';

    if (isSqlite) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER UNIQUE NOT NULL,
          email TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          expires_at INTEGER NOT NULL,
          last_sent_at INTEGER NOT NULL,
          resend_count INTEGER NOT NULL DEFAULT 0,
          resend_window_start INTEGER NOT NULL,
          reset_token_hash TEXT,
          token_expires_at INTEGER,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );
      `);
    } else {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`password_resets\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`student_id\` INT NOT NULL,
          \`email\` VARCHAR(100) NOT NULL,
          \`code_hash\` VARCHAR(100) NOT NULL,
          \`attempts\` INT NOT NULL DEFAULT 0,
          \`expires_at\` BIGINT NOT NULL,
          \`last_sent_at\` BIGINT NOT NULL,
          \`resend_count\` INT NOT NULL DEFAULT 0,
          \`resend_window_start\` BIGINT NOT NULL,
          \`reset_token_hash\` VARCHAR(100) NULL,
          \`token_expires_at\` BIGINT NULL,
          UNIQUE KEY \`uq_pr_student\` (\`student_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }
    tableChecked = true;
  } catch (err) {
    console.warn('[passwordReset] ensurePasswordResetsTable notice:', err.message);
  }
}

/**
 * Helper to execute a query with auto-healing if table is missing
 */
async function safeQuery(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146 || String(err.message).toLowerCase().includes('no such table')) {
      tableChecked = false;
      await ensurePasswordResetsTable();
      return await pool.query(sql, params);
    }
    throw err;
  }
}

/**
 * Generate and store a secure 6-digit password reset code for a student
 * Enforces a 60-second cooldown and max 5 attempts/resends per hour.
 */
async function issueResetCode(studentId, email) {
  if (!studentId || !email) {
    return { error: 'INVALID_PARAMS', message: 'Student ID and email are required.' };
  }

  await ensurePasswordResetsTable();

  const now = Date.now();
  const [rows] = await safeQuery(
    'SELECT * FROM password_resets WHERE student_id = ?',
    [studentId]
  );
  const existing = rows && rows.length > 0 ? rows[0] : null;

  let resendCount = 1;
  let windowStart = now;

  if (existing) {
    const elapsed = now - Number(existing.last_sent_at);
    if (elapsed < 60000) {
      const waitSeconds = Math.ceil((60000 - elapsed) / 1000);
      return {
        error: 'COOLDOWN',
        waitSeconds,
        message: `Please wait ${waitSeconds} seconds before requesting a new reset code.`
      };
    }

    const windowElapsed = now - Number(existing.resend_window_start);
    if (windowElapsed < 3600000) {
      resendCount = Number(existing.resend_count) + 1;
      windowStart = Number(existing.resend_window_start);
      if (resendCount > 5) {
        return {
          error: 'TOO_MANY_RESENDS',
          message: 'Maximum 5 reset codes per hour. Please wait before requesting another code.'
        };
      }
    } else {
      resendCount = 1;
      windowStart = now;
    }
  }

  // 6-digit cryptographically secure numeric code
  const code = String(crypto.randomInt(100000, 1000000));
  const { JWT_SECRET } = require('../config/secrets');
  const secret = JWT_SECRET;
  const codeHash = crypto
    .createHmac('sha256', secret)
    .update(`RESET:${studentId}:${code}`)
    .digest('hex');

  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  if (existing) {
    await safeQuery(
      `UPDATE password_resets
       SET email = ?, code_hash = ?, attempts = 0, expires_at = ?, last_sent_at = ?, resend_count = ?, resend_window_start = ?, reset_token_hash = NULL, token_expires_at = NULL
       WHERE student_id = ?`,
      [email.trim().toLowerCase(), codeHash, expiresAt, now, resendCount, windowStart, studentId]
    );
  } else {
    await safeQuery(
      `INSERT INTO password_resets
       (student_id, email, code_hash, attempts, expires_at, last_sent_at, resend_count, resend_window_start)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [studentId, email.trim().toLowerCase(), codeHash, expiresAt, now, resendCount, windowStart]
    );
  }

  return {
    success: true,
    code,
    expiresAt,
    validMinutes: 10
  };
}

/**
 * Validate a student's password reset code
 * Atomic check-and-increment of attempts to prevent brute-force attacks.
 * On success, generates and returns a secure one-time resetToken.
 */
async function checkResetCode(studentId, inputCode) {
  const codeStr = String(inputCode || '').trim();
  if (!codeStr || !/^\d{6}$/.test(codeStr)) {
    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: 'Verification code must be exactly 6 digits.'
    };
  }

  await ensurePasswordResetsTable();

  const now = Date.now();

  // Atomically increment attempt count
  await safeQuery(
    'UPDATE password_resets SET attempts = attempts + 1 WHERE student_id = ? AND attempts < 5 AND expires_at > ?',
    [studentId, now]
  );

  // Fetch updated record with code_hash
  const [rows] = await safeQuery(
    'SELECT code_hash, attempts, expires_at FROM password_resets WHERE student_id = ?',
    [studentId]
  );

  if (!rows || rows.length === 0 || !rows[0].code_hash) {
    return {
      valid: false,
      error: 'NO_ACTIVE_CODE',
      message: 'No active password reset request found. Please request a new code.'
    };
  }

  const record = rows[0];

  if (now > Number(record.expires_at)) {
    return {
      valid: false,
      error: 'CODE_EXPIRED',
      message: 'Verification code has expired (10-minute limit). Please request a new code.'
    };
  }

  if (Number(record.attempts) > 5) {
    return {
      valid: false,
      error: 'TOO_MANY_ATTEMPTS',
      message: 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  const { JWT_SECRET } = require('../config/secrets');
  const secret = JWT_SECRET;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(`RESET:${studentId}:${codeStr}`)
    .digest('hex');

  const hashBuf = Buffer.from(computedHash, 'hex');
  const dbBuf = Buffer.from(record.code_hash, 'hex');
  const isMatch = hashBuf.length === dbBuf.length && crypto.timingSafeEqual(hashBuf, dbBuf);

  if (!isMatch) {
    const remaining = 5 - Number(record.attempts);
    return {
      valid: false,
      error: 'INVALID_CODE',
      remainingAttempts: Math.max(0, remaining),
      message: remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Maximum verification attempts exceeded. Please request a new reset code.'
    };
  }

  // Code verified! Generate a cryptographic one-time resetToken valid for 10 minutes
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHmac('sha256', secret)
    .update(`AUTH_TOKEN:${studentId}:${resetToken}`)
    .digest('hex');

  const tokenExpiresAt = now + 10 * 60 * 1000;

  await safeQuery(
    `UPDATE password_resets 
     SET reset_token_hash = ?, token_expires_at = ?, code_hash = ''
     WHERE student_id = ?`,
    [resetTokenHash, tokenExpiresAt, studentId]
  );

  return {
    valid: true,
    resetToken
  };
}

/**
 * Verify and consume a one-time resetToken to authorize the password change
 */
async function verifyResetToken(studentId, resetToken) {
  if (!studentId || !resetToken) {
    return { valid: false, message: 'Invalid reset authorization.' };
  }

  await ensurePasswordResetsTable();

  const now = Date.now();
  const [rows] = await safeQuery(
    'SELECT reset_token_hash, token_expires_at FROM password_resets WHERE student_id = ?',
    [studentId]
  );

  if (!rows || rows.length === 0) {
    return { valid: false, message: 'No reset authorization found.' };
  }

  const record = rows[0];
  if (!record.reset_token_hash || now > Number(record.token_expires_at)) {
    return { valid: false, message: 'Password reset authorization has expired. Please request a new code.' };
  }

  const { JWT_SECRET } = require('../config/secrets');
  const secret = JWT_SECRET;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(`AUTH_TOKEN:${studentId}:${resetToken}`)
    .digest('hex');

  const hashBuf = Buffer.from(computedHash, 'hex');
  const dbBuf = Buffer.from(record.reset_token_hash, 'hex');
  const isMatch = hashBuf.length === dbBuf.length && crypto.timingSafeEqual(hashBuf, dbBuf);

  if (!isMatch) {
    return { valid: false, message: 'Invalid reset token.' };
  }

  // Clean up reset authorization so it can never be reused
  await safeQuery('DELETE FROM password_resets WHERE student_id = ?', [studentId]);

  return { valid: true };
}

module.exports = {
  issueResetCode,
  checkResetCode,
  verifyResetToken,
  ensurePasswordResetsTable
};
