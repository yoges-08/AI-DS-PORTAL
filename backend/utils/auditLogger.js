const { pool } = require('../config/db');

/**
 * Log administrative actions into audit_logs table
 * @param {Object} params
 * @param {number|null} params.adminId
 * @param {string} params.adminUsername
 * @param {string} params.action - LOCK, UNLOCK, RESET_PASSWORD, UPDATE_STUDENT, BULK_IMPORT, VERIFY, REJECT, EXPORT_EXCEL, EXPORT_PDF
 * @param {number|null} params.studentId
 * @param {string|null} params.studentRegNo
 * @param {string|null} params.details
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
      typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress
    ]);
  } catch (error) {
    console.error('[AuditLog Error]: Failed to record audit log:', error.message);
  }
};

module.exports = {
  logAdminAction
};
