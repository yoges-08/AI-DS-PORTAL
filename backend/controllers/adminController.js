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
  dobToPasswordString,
  normalizeDob
} = require('../utils/validators');
const { logAdminAction } = require('../utils/auditLogger');

// Safe parsing helpers
const toPositiveInt = (v, fallback) => {
  const n = parseInt(Array.isArray(v) ? v[0] : v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toSafeString = (v) => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
};

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
    const search = toSafeString(req.query.search).trim();
    const section = toSafeString(req.query.section).trim().toUpperCase();
    const status = toSafeString(req.query.status).trim().toUpperCase();
    const sortBy = toSafeString(req.query.sortBy).trim();
    const sortOrder = toSafeString(req.query.sortOrder).trim().toUpperCase();
    const { firstGraduate, pms } = req.query;

    const pageNum = toPositiveInt(req.query.page, 1);
    const limitNum = Math.min(100, toPositiveInt(req.query.limit, 10));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(register_no LIKE ? OR name LIKE ? OR mobile LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (req.query.year !== undefined && req.query.year !== '') {
      const yearNum = parseInt(Array.isArray(req.query.year) ? req.query.year[0] : req.query.year, 10);
      if (Number.isFinite(yearNum) && [1, 2, 3, 4].includes(yearNum)) {
        conditions.push('year = ?');
        params.push(yearNum);
      }
    }

    if (section) {
      conditions.push('section = ?');
      params.push(section);
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
      params.push(status);
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
    const sortDir = sortOrder === 'DESC' ? 'DESC' : 'ASC';

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

    const regNo = toSafeString(registerNo).trim();
    const studentName = toSafeString(name).trim();
    const sec = toSafeString(section).trim().toUpperCase();
    const normalizedDob = normalizeDob(dob);
    const yearNum = parseInt(year, 10);

    if (!regNo || !studentName || !normalizedDob || !Number.isFinite(yearNum) || !sec) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Register Number, Name, valid DOB, Year, Section) are required.'
      });
    }

    if (![1, 2, 3, 4].includes(yearNum)) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 1 and 4.'
      });
    }

    if (!validateRegisterNo(regNo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE register_no = ?',
      [regNo]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Student with Register Number ${regNo} already exists.`
      });
    }

    // Hash DOB (format DDMMYYYY) for default password
    const pwdString = dobToPasswordString(normalizedDob);
    const hashedPassword = await bcrypt.hash(pwdString, 10);

    const insertQuery = `
      INSERT INTO students (register_no, name, dob, password, year, section, status, is_locked)
      VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 0)
    `;

    const [result] = await pool.query(insertQuery, [
      regNo,
      studentName,
      normalizedDob,
      hashedPassword,
      yearNum,
      sec
    ]);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'ADD_STUDENT',
      studentId: result.insertId,
      studentRegNo: regNo,
      details: `Added new student ${studentName} (${regNo}) in Year ${yearNum}, Sec ${sec}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Student ${studentName} (${regNo}) added successfully.`
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
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
  }

  const filePath = req.file.path;
  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ success: false, message: 'Spreadsheet has no sheets.' });
    }
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded spreadsheet is empty.' });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const seenInBatch = new Set();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2;
      const regNo = String(row['Register Number'] || row['register_no'] || row['RegNo'] || row['Reg No'] || '').trim();
      const name = String(row['Name'] || row['name'] || row['Student Name'] || '').trim();
      const rawDob = row['DOB'] !== undefined && row['DOB'] !== '' ? row['DOB'] : (row['dob'] !== undefined && row['dob'] !== '' ? row['dob'] : row['Date of Birth']);
      const rawYear = row['Year'] !== undefined && row['Year'] !== '' ? row['Year'] : row['year'];
      const year = parseInt(rawYear || '1', 10);
      const section = String(row['Section'] || row['section'] || 'A').trim().toUpperCase();

      if (!regNo || !name || rawDob === undefined || rawDob === '') {
        errors.push(`Row ${rowNum}: Missing required fields (Register Number, Name, or DOB).`);
        skippedCount++;
        continue;
      }

      if (!validateRegisterNo(regNo)) {
        errors.push(`Row ${rowNum}: Invalid Register Number format (${regNo}).`);
        skippedCount++;
        continue;
      }

      if (seenInBatch.has(regNo.toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate Register Number (${regNo}) in spreadsheet.`);
        skippedCount++;
        continue;
      }
      seenInBatch.add(regNo.toLowerCase());

      const dob = normalizeDob(rawDob);
      if (!dob) {
        errors.push(`Row ${rowNum}: Invalid DOB for ${regNo}. Please provide a valid calendar date.`);
        skippedCount++;
        continue;
      }

      if (![1, 2, 3, 4].includes(year)) {
        errors.push(`Row ${rowNum}: Year must be between 1 and 4 for ${regNo}.`);
        skippedCount++;
        continue;
      }

      // Check if student exists in database
      const [existing] = await pool.query('SELECT id FROM students WHERE register_no = ?', [regNo]);
      if (existing.length > 0) {
        errors.push(`Row ${rowNum}: Register Number ${regNo} already exists in system.`);
        skippedCount++;
        continue;
      }

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
        console.error(`[bulkImport DB Error row ${rowNum}]:`, err);
        errors.push(`Row ${rowNum}: Database insertion error for ${regNo}.`);
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
      errors: errors.slice(0, 15)
    });
  } catch (error) {
    console.error('[bulkImportStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process bulk import.' });
  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('[bulkImport cleanup error]:', e);
    }
  }
};

/**
 * Lock or Unlock student profile
 */
const toggleLockStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    const { lock } = req.body; // true = lock, false = unlock

    if (typeof lock !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing "lock" parameter. Must be boolean true or false.'
      });
    }

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

    // Do NOT write the plain password to audit log
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'RESET_PASSWORD',
      studentId,
      studentRegNo: student.register_no,
      details: `Password reset to DOB for student ${student.name} (${student.register_no})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Password for ${student.name} (${student.register_no}) has been reset back to Date of Birth.`
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
      `UPDATE students SET 
         status = ?, 
         rejection_reason = ?,
         is_locked = CASE WHEN ? IN ('REJECTED', 'DRAFT') THEN 0 ELSE is_locked END,
         locked_at = CASE WHEN ? IN ('REJECTED', 'DRAFT') THEN NULL ELSE locked_at END,
         locked_by = CASE WHEN ? IN ('REJECTED', 'DRAFT') THEN NULL ELSE locked_by END
       WHERE id = ?`,
      [
        status,
        status === 'REJECTED' ? rejectionReason || 'Information incomplete' : null,
        status,
        status,
        status,
        studentId
      ]
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
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(100, toPositiveInt(req.query.limit, 20));
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

