const { pool } = require('../config/db');

/**
 * Regex matching sensitive keys that should never be stored in plaintext audit log records.
 */
const SENSITIVE_KEY_REGEX = /pass(word)?|aadhaar|bank|acc(ount)?|ifsc|token|secret|pin|income|mobile/i;

/**
 * Recursively sanitize / scrub sensitive PII fields from audit metadata.
 */
const scrubPII = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    // Mask potential 12-digit Aadhaar numbers in strings
    return val.replace(/\b\d{8}(\d{4})\b/g, 'XXXX-XXXX-$1');
  }
  if (Array.isArray(val)) {
    return val.map(scrubPII);
  }
  if (typeof val === 'object') {
    const scrubbed = {};
    for (const [k, v] of Object.entries(val)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        scrubbed[k] = '[REDACTED]';
      } else {
        scrubbed[k] = scrubPII(v);
      }
    }
    return scrubbed;
  }
  return val;
};

/**
 * Log administrative actions into audit_logs table
 * @param {Object} params
 * @param {number|null} params.adminId
 * @param {string} params.adminUsername
 * @param {string} params.action - LOCK, UNLOCK, RESET_PASSWORD, UPDATE_STUDENT, BULK_IMPORT, VERIFY, REJECT, EXPORT_EXCEL, EXPORT_PDF
 * @param {number|null} params.studentId
 * @param {string|null} params.studentRegNo
 * @param {any} params.details
 * @param {string|null} params.ipAddress
 */
const logAdminAction = async ({
  adminId = null,
  adminUsername,
  action,
  studentId = null,
  studentRegNo = null,
  details = null,
  ipAddress = null
}) => {
  try {
    let sanitizedDetails = details;
    if (typeof details === 'object' && details !== null) {
      sanitizedDetails = JSON.stringify(scrubPII(details));
    } else if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        sanitizedDetails = JSON.stringify(scrubPII(parsed));
      } catch (e) {
        sanitizedDetails = scrubPII(details);
      }
    }

    const query = `
      INSERT INTO audit_logs (admin_id, admin_username, action, student_id, student_reg_no, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    await pool.query(query, [
      adminId,
      adminUsername || 'SYSTEM',
      action,
      studentId,
      studentRegNo,
      sanitizedDetails,
      ipAddress
    ]);
  } catch (error) {
    console.error('[AuditLog Error]: Failed to record audit log:', error.message);
  }
};

module.exports = {
  logAdminAction,
  scrubPII
};
