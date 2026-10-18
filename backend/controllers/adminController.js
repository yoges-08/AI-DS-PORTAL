const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');
const { pool } = require('../config/db');
const {
  validateRegisterNo,
  validateMobile,
  validateAadhaar,
  validateIfsc,
  validatePincode,
  maskAadhaar,
  maskBankAcc,
  dobToPasswordString
} = require('../utils/validators');
const { logAdminAction } = require('../utils/auditLogger');

/**
 * Get Admin Dashboard Summary Cards statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COUNT(*) AS total_students,
        SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) AS submitted_count,
        SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN is_first_graduate = 1 THEN 1 ELSE 0 END) AS first_graduate_count,
        SUM(CASE WHEN is_pms = 1 THEN 1 ELSE 0 END) AS pms_count,
        SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) AS locked_count
      FROM students
    `);

    // Distribution by Year
    const [byYear] = await pool.query(`
      SELECT year, COUNT(*) AS count 
      FROM students 
      GROUP BY year 
      ORDER BY year ASC
    `);

    // Distribution by Section
    const [bySection] = await pool.query(`
      SELECT section, COUNT(*) AS count 
      FROM students 
      GROUP BY section 
      ORDER BY section ASC
    `);

    return res.json({
      success: true,
      stats: {
        totalStudents: counts[0].total_students || 0,
        submitted: counts[0].submitted_count || 0,
        pending: counts[0].pending_count || 0,
        verified: counts[0].verified_count || 0,
        firstGraduates: counts[0].first_graduate_count || 0,
        pmsBeneficiaries: counts[0].pms_count || 0,
        lockedRecords: counts[0].locked_count || 0,
        byYear,
        bySection
      }
    });
  } catch (error) {
    console.error('[getDashboardStats Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
};

/**
 * Get Students with search, filters, pagination, and sorting
 */
const getStudents = async (req, res) => {
  try {
    const {
      search = '',
      year,
      section,
      firstGraduate,
      pms,
      status,
      sortBy = 'register_no',
      sortOrder = 'ASC',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push('(register_no LIKE ? OR name LIKE ? OR mobile LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year, 10));
    }

    if (section) {
      conditions.push('section = ?');
      params.push(section.trim().toUpperCase());
    }

    if (firstGraduate !== undefined && firstGraduate !== '') {
      conditions.push('is_first_graduate = ?');
      params.push(firstGraduate === 'true' || firstGraduate === '1' ? 1 : 0);
    }

    if (pms !== undefined && pms !== '') {
      conditions.push('is_pms = ?');
      params.push(pms === 'true' || pms === '1' ? 1 : 0);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    const allowedSortColumns = {
      'register_no': 'register_no',
      'name': 'name',
      'year': 'year',
      'section': 'section',
      'status': 'status',
      'created_at': 'created_at',
      'submission_date': 'submission_date'
    };
    const sortCol = allowedSortColumns[sortBy] || 'register_no';
    const sortDir = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM students ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Fetch records
    const selectQuery = `
      SELECT id, register_no, name, dob, year, section, mobile, email,
             aadhaar_no, bank_acc_no, is_first_graduate, is_pms, pms_status,
             status, is_locked, submission_date, created_at
      FROM students
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(selectQuery, [...params, limitNum, offset]);

    // Mask sensitive Aadhaar & Bank Account in list view
    const maskedStudents = rows.map((s) => ({
      ...s,
      is_locked: Boolean(s.is_locked),
      is_first_graduate: Boolean(s.is_first_graduate),
      is_pms: Boolean(s.is_pms),
      aadhaar_no: maskAadhaar(s.aadhaar_no),
      bank_acc_no: maskBankAcc(s.bank_acc_no)
    }));

    return res.json({
      success: true,
      students: maskedStudents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('[getStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students list.' });
  }
};

/**
 * Add a single student manually
 */
const addStudent = async (req, res) => {
  try {
    const { registerNo, name, dob, year, section } = req.body;

    if (!registerNo || !name || !dob || !year || !section) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Register Number, Name, DOB, Year, Section) are required.'
      });
    }

    if (!validateRegisterNo(registerNo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE register_no = ?',
      [registerNo.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Student with Register Number ${registerNo} already exists.`
      });
    }

    // Hash DOB (format DDMMYYYY) for default password
    const pwdString = dobToPasswordString(dob);
    const hashedPassword = await bcrypt.hash(pwdString, 10);

    const insertQuery = `
      INSERT INTO students (register_no, name, dob, password, year, section, status, is_locked)
      VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 0)
    `;

    const [result] = await pool.query(insertQuery, [
      registerNo.trim(),
      name.trim(),
      dob.trim(),
      hashedPassword,
      parseInt(year, 10),
      section.trim().toUpperCase()
    ]);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'ADD_STUDENT',
      studentId: result.insertId,
      studentRegNo: registerNo.trim(),
      details: `Added new student ${name} (${registerNo}) in Year ${year}, Sec ${section}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Student ${name} (${registerNo}) added successfully. Default password is DOB (${pwdString}).`
    });
  } catch (error) {
    console.error('[addStudent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to add student.' });
  }
};

/**
 * Bulk import students from Excel or CSV
 */
const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    // Remove temp uploaded file
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded spreadsheet is empty.' });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      // Map possible column header aliases
      const regNo = String(row['Register Number'] || row['register_no'] || row['RegNo'] || row['Reg No'] || '').trim();
      const name = String(row['Name'] || row['name'] || row['Student Name'] || '').trim();
      let dob = String(row['DOB'] || row['dob'] || row['Date of Birth'] || '').trim();
      const year = parseInt(row['Year'] || row['year'] || '1', 10);
      const section = String(row['Section'] || row['section'] || 'A').trim().toUpperCase();

      if (!regNo || !name || !dob) {
        errors.push(`Row ${i + 2}: Missing required fields (Register Number, Name, or DOB).`);
        skippedCount++;
        continue;
      }

      // Check if student exists
      const [existing] = await pool.query('SELECT id FROM students WHERE register_no = ?', [regNo]);
      if (existing.length > 0) {
        errors.push(`Row ${i + 2}: Register Number ${regNo} already exists.`);
        skippedCount++;
        continue;
      }

      // Format DOB if needed
      const pwdString = dobToPasswordString(dob);
      const hashedPassword = await bcrypt.hash(pwdString, 10);

      try {
        await pool.query(
          `INSERT INTO students (register_no, name, dob, password, year, section, status, is_locked)
           VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 0)`,
          [regNo, name, dob, hashedPassword, year, section]
        );
        insertedCount++;
      } catch (err) {
        errors.push(`Row ${i + 2}: DB Error - ${err.message}`);
        skippedCount++;
      }
    }

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'BULK_IMPORT',
      details: `Bulk imported ${insertedCount} students. ${skippedCount} skipped.`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Bulk import completed: ${insertedCount} students imported, ${skippedCount} skipped.`,
      insertedCount,
      skippedCount,
      errors: errors.slice(0, 10) // show top 10 errors if any
    });
  } catch (error) {
    console.error('[bulkImportStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process bulk import.' });
  }
};

/**
 * Lock or Unlock student profile
 */
const toggleLockStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { lock } = req.body; // true = lock, false = unlock

    const [student] = await pool.query('SELECT register_no, name, is_locked FROM students WHERE id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const newLockState = lock ? 1 : 0;
    const lockedAt = lock ? new Date() : null;
    const lockedBy = lock ? req.user.username : null;

    await pool.query(
      'UPDATE students SET is_locked = ?, locked_at = ?, locked_by = ? WHERE id = ?',
      [newLockState, lockedAt, lockedBy, studentId]
    );

    const action = lock ? 'LOCK' : 'UNLOCK';
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action,
      studentId,
      studentRegNo: student[0].register_no,
      details: `${action} applied to student ${student[0].name} (${student[0].register_no})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Student record has been ${lock ? 'LOCKED' : 'UNLOCKED'} successfully.`,
      isLocked: Boolean(newLockState)
    });
  } catch (error) {
    console.error('[toggleLockStudent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update lock status.' });
  }
};

/**
 * Reset student's password back to their DOB
 */
const resetStudentPassword = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    const [rows] = await pool.query('SELECT register_no, name, dob FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = rows[0];
    const pwdString = dobToPasswordString(student.dob);
    const hashedPassword = await bcrypt.hash(pwdString, 10);

    await pool.query('UPDATE students SET password = ? WHERE id = ?', [hashedPassword, studentId]);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'RESET_PASSWORD',
      studentId,
      studentRegNo: student.register_no,
      details: `Password reset to DOB (${pwdString}) for student ${student.name} (${student.register_no})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password for ${student.name} (${student.register_no}) has been reset back to Date of Birth (${pwdString}).`
    });
  } catch (error) {
    console.error('[resetStudentPassword Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * Verify or Reject student profile
 */
const updateStudentStatus = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { status, rejectionReason } = req.body;

    if (!['VERIFIED', 'REJECTED', 'DRAFT', 'SUBMITTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const [rows] = await pool.query('SELECT register_no, name FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await pool.query(
      'UPDATE students SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, status === 'REJECTED' ? rejectionReason || 'Information incomplete' : null, studentId]
    );

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: status === 'VERIFIED' ? 'VERIFY' : (status === 'REJECTED' ? 'REJECT' : 'STATUS_UPDATE'),
      studentId,
      studentRegNo: rows[0].register_no,
      details: `Status updated to ${status}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Student status successfully updated to ${status}.`
    });
  } catch (error) {
    console.error('[updateStudentStatus Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update student status.' });
  }
};

/**
 * Get Audit logs for Admin review
 */
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM audit_logs');
    const total = countRows[0].total;

    const [logs] = await pool.query(
      `SELECT id, admin_username, action, student_reg_no, details, ip_address, created_at 
       FROM audit_logs 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[getAuditLogs Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load audit logs.' });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  addStudent,
  bulkImportStudents,
  toggleLockStudent,
  resetStudentPassword,
  updateStudentStatus,
  getAuditLogs
};
