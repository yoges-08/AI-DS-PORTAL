const crypto = require('crypto');
const { pool } = require('../config/db');

/**
 * Generate and store a secure 6-digit password reset code for a student
 * Enforces a 60-second cooldown and max 5 attempts/resends per hour.
 */
async function issueResetCode(studentId, email) {
  if (!studentId || !email) {
    return { error: 'INVALID_PARAMS', message: 'Student ID and email are required.' };
  }

  const now = Date.now();
  const [rows] = await pool.query(
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
    await pool.query(
      `UPDATE password_resets
       SET email = ?, code_hash = ?, attempts = 0, expires_at = ?, last_sent_at = ?, resend_count = ?, resend_window_start = ?, reset_token_hash = NULL, token_expires_at = NULL
       WHERE student_id = ?`,
      [email.trim().toLowerCase(), codeHash, expiresAt, now, resendCount, windowStart, studentId]
    );
  } else {
    await pool.query(
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

  const now = Date.now();
  // Atomic check-and-increment to prevent concurrent race condition bypasses
  const [updateRes] = await pool.query(
    'UPDATE password_resets SET attempts = attempts + 1 WHERE student_id = ? AND attempts < 5 AND expires_at > ?',
    [studentId, now]
  );

  if (updateRes.affectedRows === 0) {
    const [checkRows] = await pool.query(
      'SELECT attempts, expires_at FROM password_resets WHERE student_id = ?',
      [studentId]
    );
    if (!checkRows || checkRows.length === 0) {
      return {
        valid: false,
        error: 'NO_PENDING_CODE',
        message: 'No pending reset code found. Please request a new code.'
      };
    }
    if (now > Number(checkRows[0].expires_at)) {
      return {
        valid: false,
        error: 'EXPIRED',
        message: 'Reset code has expired. Please request a new code.'
      };
    }
    return {
      valid: false,
      error: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Please request a new reset code.'
    };
  }

  // Fetch updated record to verify HMAC
  const [rows] = await pool.query(
    'SELECT code_hash, attempts FROM password_resets WHERE student_id = ?',
    [studentId]
  );
  if (!rows || rows.length === 0) {
    return {
      valid: false,
      error: 'NO_PENDING_CODE',
      message: 'No pending reset code found. Please request a new code.'
    };
  }

  const record = rows[0];
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

  await pool.query(
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

  const now = Date.now();
  const [rows] = await pool.query(
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
  await pool.query('DELETE FROM password_resets WHERE student_id = ?', [studentId]);

  return { valid: true };
}

module.exports = {
  issueResetCode,
  checkResetCode,
  verifyResetToken
};
