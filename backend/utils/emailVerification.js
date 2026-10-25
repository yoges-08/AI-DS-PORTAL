const crypto = require('crypto');
const { pool } = require('../config/db');

/**
 * Generate and store a 6-digit verification code for a student
 */
async function issueCode(studentId, email) {
  if (!studentId || !email) {
    return { error: 'INVALID_PARAMS', message: 'Student ID and email are required.' };
  }

  const now = Date.now();
  const [rows] = await pool.query(
    'SELECT * FROM email_verifications WHERE student_id = ?',
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
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`
      };
    }

    const windowElapsed = now - Number(existing.resend_window_start);
    if (windowElapsed < 3600000) {
      resendCount = Number(existing.resend_count) + 1;
      windowStart = Number(existing.resend_window_start);
      if (resendCount > 5) {
        return {
          error: 'TOO_MANY_RESENDS',
          message: 'Maximum 5 codes per hour. Please wait before requesting another code.'
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
    .update(`${studentId}:${code}`)
    .digest('hex');

  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  if (existing) {
    await pool.query(
      `UPDATE email_verifications
       SET email = ?, code_hash = ?, attempts = 0, expires_at = ?, last_sent_at = ?, resend_count = ?, resend_window_start = ?
       WHERE student_id = ?`,
      [email.trim().toLowerCase(), codeHash, expiresAt, now, resendCount, windowStart, studentId]
    );
  } else {
    await pool.query(
      `INSERT INTO email_verifications
       (student_id, email, code_hash, attempts, expires_at, last_sent_at, resend_count, resend_window_start)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [studentId, email.trim().toLowerCase(), codeHash, expiresAt, now, resendCount, windowStart]
    );
  }

  return {
    success: true,
    code,
    expiresAt
  };
}

/**
 * Validate a student's verification code
 */
async function checkCode(studentId, inputCode) {
  const codeStr = String(inputCode || '').trim();
  if (!codeStr || !/^\d{6}$/.test(codeStr)) {
    return {
      valid: false,
      error: 'INVALID_FORMAT',
      message: 'Verification code must be exactly 6 digits.'
    };
  }

  const now = Date.now();
  // Atomic check-and-increment to prevent concurrent race condition bypasses (SEC-HIGH-03)
  const [updateRes] = await pool.query(
    'UPDATE email_verifications SET attempts = attempts + 1 WHERE student_id = ? AND attempts < 5 AND expires_at > ?',
    [studentId, now]
  );

  if (updateRes.affectedRows === 0) {
    const [checkRows] = await pool.query(
      'SELECT attempts, expires_at FROM email_verifications WHERE student_id = ?',
      [studentId]
    );
    if (!checkRows || checkRows.length === 0) {
      return {
        valid: false,
        error: 'NO_PENDING_CODE',
        message: 'No pending verification code found. Please request a new one.'
      };
    }
    if (now > Number(checkRows[0].expires_at)) {
      return {
        valid: false,
        error: 'EXPIRED',
        message: 'Verification code has expired. Please request a new code.'
      };
    }
    return {
      valid: false,
      error: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  // Fetch updated record to verify HMAC
  const [rows] = await pool.query(
    'SELECT code_hash, attempts FROM email_verifications WHERE student_id = ?',
    [studentId]
  );
  if (!rows || rows.length === 0) {
    return {
      valid: false,
      error: 'NO_PENDING_CODE',
      message: 'No pending verification code found. Please request a new one.'
    };
  }

  const record = rows[0];
  const { JWT_SECRET } = require('../config/secrets');
  const secret = JWT_SECRET;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(`${studentId}:${codeStr}`)
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
        : 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  // Success: mark student verified and delete verification record
  await pool.query('DELETE FROM email_verifications WHERE student_id = ?', [studentId]);
  await pool.query('UPDATE students SET email_verified = 1 WHERE id = ?', [studentId]);

  return { valid: true };
}

module.exports = {
  issueCode,
  checkCode
};
