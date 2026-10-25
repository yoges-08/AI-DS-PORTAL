const { pool } = require('../config/db');

/**
 * Mask an email address for safe logging and display (e.g. j***n@gmail.com)
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***@***.***';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***@***.***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Check if mailing is enabled
 */
function mailEnabled() {
  const enabled = process.env.MAIL_ENABLED === 'true';
  const hasKey = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
  const hasSender = Boolean(process.env.MAIL_FROM_EMAIL && process.env.MAIL_FROM_EMAIL.trim());
  return enabled && hasKey && hasSender;
}

/**
 * Check if the daily limit of sent emails has been reached
 */
async function overDailyLimit() {
  const limit = parseInt(process.env.MAIL_DAILY_LIMIT || '250', 10);
  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM email_logs
       WHERE status = 'SENT' AND created_at >= ?`,
      [`${today} 00:00:00`]
    );
    const count = rows && rows[0] ? Number(rows[0].count) : 0;
    return count >= limit;
  } catch (err) {
    console.error('[Mailer] Error checking daily limit:', err.message);
    return false;
  }
}

/**
 * Low-level deliver function via Brevo HTTPS REST API
 */
async function deliver({
  toEmail,
  toName,
  subject,
  htmlContent,
  textContent,
  attachments = [],
  studentId = null,
  template = 'unknown'
}) {
  const maskedTo = maskEmail(toEmail);

  // 1. Kill switch check
  if (!mailEnabled()) {
    try {
      await pool.query(
        `INSERT INTO email_logs (student_id, to_email, template, status, error)
         VALUES (?, ?, ?, 'SKIPPED', 'Mailing disabled or missing BREVO_API_KEY')`,
        [studentId, maskedTo, template]
      );
    } catch (e) {
      // ignore db logging error
    }
    return { success: false, skipped: true, error: 'Mailing disabled' };
  }

  // 2. Validate recipient
  if (!toEmail || !toEmail.includes('@')) {
    try {
      await pool.query(
        `INSERT INTO email_logs (student_id, to_email, template, status, error)
         VALUES (?, ?, ?, 'FAILED', 'Invalid recipient email')`,
        [studentId, maskedTo, template]
      );
    } catch (e) {}
    return { success: false, error: 'Invalid recipient email' };
  }

  // 3. Daily limit check
  if (await overDailyLimit()) {
    console.warn(`[Mailer] Daily email limit reached. Skipping delivery to ${maskedTo} (${template})`);
    try {
      await pool.query(
        `INSERT INTO email_logs (student_id, to_email, template, status, error)
         VALUES (?, ?, ?, 'SKIPPED', 'Daily limit reached')`,
        [studentId, maskedTo, template]
      );
    } catch (e) {}
    return { success: false, skipped: true, error: 'Daily limit reached' };
  }

  // 4. Construct payload for Brevo API
  const senderEmail = (process.env.MAIL_FROM_EMAIL || '').trim();
  if (!senderEmail) {
    console.error(`[Mailer] Cannot send ${template} to ${maskedTo}: MAIL_FROM_EMAIL is not configured.`);
    return { success: false, error: 'MAIL_FROM_EMAIL is not configured' };
  }
  const senderName = process.env.MAIL_FROM_NAME || 'AI & DS Portal - AAMEC';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail.trim(), name: toName || toEmail.trim() }],
    subject: subject,
    htmlContent: htmlContent,
    textContent: textContent || htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  };

  if (process.env.MAIL_REPLY_TO && process.env.MAIL_REPLY_TO.trim()) {
    payload.replyTo = {
      email: process.env.MAIL_REPLY_TO.trim(),
      name: senderName
    };
  }

  if (Array.isArray(attachments) && attachments.length > 0) {
    payload.attachment = attachments.map(att => ({
      name: att.name,
      content: att.content // Base64 encoded string
    }));
  }

  // 5. Send HTTPS request with 15-second timeout and 1 automatic retry on transient error
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = body?.message || `Brevo HTTP ${res.status}`;
        if ((res.status >= 500 || res.status === 429) && attempt < maxAttempts) {
          console.warn(`[Mailer] Brevo transient HTTP ${res.status}. Retrying in 1.5s (attempt ${attempt}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        console.error(`[Mailer] Failed sending ${template} to ${maskedTo}: ${errMsg}`);
        try {
          await pool.query(
            `INSERT INTO email_logs (student_id, to_email, template, status, error)
             VALUES (?, ?, ?, 'FAILED', ?)`,
            [studentId, maskedTo, template, errMsg.slice(0, 255)]
          );
        } catch (e) {}
        return { success: false, error: errMsg };
      }

      const messageId = body?.messageId || 'OK';
      console.log(`[Mailer] Successfully delivered ${template} to ${maskedTo} (ID: ${messageId})`);

      try {
        await pool.query(
          `INSERT INTO email_logs (student_id, to_email, template, status, provider_message_id)
           VALUES (?, ?, ?, 'SENT', ?)`,
          [studentId, maskedTo, template, String(messageId).slice(0, 100)]
        );
      } catch (e) {}

      return { success: true, messageId };
    } catch (err) {
      clearTimeout(timeoutId);
      const errMsg = err.name === 'AbortError' ? 'Brevo request timed out (15s)' : (err.message || 'Unknown network error');
      if (attempt < maxAttempts) {
        console.warn(`[Mailer] Network error sending ${template}: ${errMsg}. Retrying in 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      console.error(`[Mailer] Exception sending ${template} to ${maskedTo}: ${errMsg}`);

      try {
        await pool.query(
          `INSERT INTO email_logs (student_id, to_email, template, status, error)
           VALUES (?, ?, ?, 'FAILED', ?)`,
          [studentId, maskedTo, template, errMsg.slice(0, 255)]
        );
      } catch (e) {}

      return { success: false, error: errMsg };
    }
  }
}

/**
 * Synchronous send (waits for deliver result, e.g. for registration verification code E1)
 */
async function sendNow(options) {
  return await deliver(options);
}

/**
 * In-memory concurrency queue for background emails (max concurrency: 2)
 */
class ConcurrencyQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  push(taskFn) {
    this.queue.push(taskFn);
    this.processNext();
  }

  processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    const taskFn = this.queue.shift();
    this.running++;
    taskFn()
      .catch(err => {
        console.error('[Mailer Queue] Task error:', err.message);
      })
      .finally(() => {
        this.running--;
        this.processNext();
      });
  }
}

const backgroundQueue = new ConcurrencyQueue(2);

/**
 * Fire-and-forget background send (E2 through E7)
 */
function sendInBackground(options) {
  backgroundQueue.push(async () => {
    await deliver(options);
  });
}

module.exports = {
  deliver,
  sendNow,
  sendInBackground,
  mailEnabled,
  maskEmail,
  overDailyLimit
};
