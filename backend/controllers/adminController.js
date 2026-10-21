let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { deleteObject } = require('../config/storage');
const {
  cleanRegisterNo,
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

    // Distribution by Year (handle NULL as 'Not set')
    const [byYear] = await pool.query(`
      SELECT year, COUNT(*) AS count 
      FROM students 
      GROUP BY year 
      ORDER BY CASE WHEN year IS NULL THEN 1 ELSE 0 END, year ASC
    `);

    // Distribution by Section (handle NULL as 'Not set')
    const [bySection] = await pool.query(`
      SELECT section, COUNT(*) AS count 
      FROM students 
      GROUP BY section 
      ORDER BY CASE WHEN section IS NULL THEN 1 ELSE 0 END, section ASC
    `);

    const formattedByYear = byYear.map(item => ({
      year: item.year !== null && item.year !== undefined ? item.year : 'Not set',
      count: item.count || 0
    }));

    const formattedBySection = bySection.map(item => ({
      section: item.section ? item.section : 'Not set',
      count: item.count || 0
    }));

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
        byYear: formattedByYear,
        bySection: formattedBySection
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

    if (req.query.semester !== undefined && req.query.semester !== '') {
      const semNum = parseInt(Array.isArray(req.query.semester) ? req.query.semester[0] : req.query.semester, 10);
      if (Number.isFinite(semNum) && semNum >= 1 && semNum <= 8) {
        conditions.push('current_semester = ?');
        params.push(semNum);
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
      'current_semester': 'current_semester',
      'semester': 'current_semester',
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
      SELECT id, register_no, name, dob, year, current_semester, section, mobile, email,
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

    const regNo = cleanRegisterNo(toSafeString(registerNo));
    const studentName = toSafeString(name).trim();
    const normalizedDob = normalizeDob(dob);

    if (!regNo || !studentName || !normalizedDob) {
      return res.status(400).json({
        success: false,
        message: 'Register Number, Name, and valid Date of Birth (DOB) are required.'
      });
    }

    if (!validateRegisterNo(regNo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    // Optional Year validation (1-4 if provided, otherwise null)
    let yearNum = null;
    if (year !== undefined && year !== null && String(year).trim() !== '') {
      const parsedYear = parseInt(year, 10);
      if ([1, 2, 3, 4].includes(parsedYear)) {
        yearNum = parsedYear;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Year must be between 1 and 4 if provided.'
        });
      }
    }

    // Optional Section validation (A-D if provided, otherwise null)
    let sec = null;
    if (section !== undefined && section !== null && String(section).trim() !== '') {
      const parsedSec = toSafeString(section).trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(parsedSec)) {
        sec = parsedSec;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Section must be A, B, C, or D if provided.'
        });
      }
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
      details: `Added new student ${studentName} (${regNo})${yearNum ? ` in Year ${yearNum}` : ''}${sec ? `, Sec ${sec}` : ''}`,
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
 * Supports dynamic column detection, custom/missing headers, scientific notation (e.g. 8.20E+11),
 * flexible date parsing (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY), and smart synchronization (UPSERT)
 * for existing students so their login credentials (DOB) and profile details are updated.
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

    // Read sheet as 2D array of rows
    const allRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    const nonEmptyRows = allRows.filter(row => Array.isArray(row) && row.some(cell => String(cell).trim() !== ''));

    if (!nonEmptyRows || nonEmptyRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded spreadsheet is empty.' });
    }

    const firstRow = nonEmptyRows[0];
    const hasHeaderWords = firstRow.some(cell =>
      /name|dob|birth|year|sec|reg|roll|student/i.test(String(cell).trim())
    );

    let headerRow;
    let dataRows;
    let startRowNum;

    if (hasHeaderWords) {
      headerRow = firstRow;
      dataRows = nonEmptyRows.slice(1);
      startRowNum = 2;
    } else {
      headerRow = null;
      dataRows = nonEmptyRows;
      startRowNum = 1;
    }

    if (dataRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded spreadsheet contains headers but no student records.' });
    }

    // Resolve column indices dynamically
    let regCol = -1;
    let nameCol = -1;
    let dobCol = -1;
    let yearCol = -1;
    let secCol = -1;

    if (headerRow) {
      headerRow.forEach((cell, idx) => {
        const header = String(cell).trim();
        if (regCol === -1 && /^(reg(ister)?([_\s]?no|\.?)?|roll([_\s]?no|\.?)?|student([_\s]?(id|no))?|admission([_\s]?no)?)$/i.test(header)) {
          regCol = idx;
        } else if (regCol === -1 && /reg|roll|student_?id/i.test(header)) {
          regCol = idx;
        }

        if (nameCol === -1 && /^(student([_\s]?name)?|name|full([_\s]?name)?)$/i.test(header)) {
          nameCol = idx;
        } else if (nameCol === -1 && /name/i.test(header)) {
          nameCol = idx;
        }

        if (dobCol === -1 && /^(dob|date([_\s]?of[_\s]?birth)?|birth([_\s]?date)?)$/i.test(header)) {
          dobCol = idx;
        } else if (dobCol === -1 && /dob|birth/i.test(header)) {
          dobCol = idx;
        }

        if (yearCol === -1 && /^(year|yr|class|grade)$/i.test(header)) {
          yearCol = idx;
        } else if (yearCol === -1 && /year|yr|class/i.test(header)) {
          yearCol = idx;
        }

        if (secCol === -1 && /^(sec(tion)?)$/i.test(header)) {
          secCol = idx;
        } else if (secCol === -1 && /sec/i.test(header)) {
          secCol = idx;
        }
      });
    }

    // Positional fallbacks for missing/unrecognized columns (e.g. cell A1 having '71762205052')
    if (regCol === -1) regCol = 0;
    if (nameCol === -1) nameCol = 1;
    if (dobCol === -1) dobCol = 2;
    // yearCol and secCol are optional: only fallback if there are extra columns in the sheet
    if (yearCol === -1 && (headerRow ? headerRow.length > 3 : firstRow.length > 3)) {
      yearCol = 3;
    }
    if (secCol === -1 && (headerRow ? headerRow.length > 4 : firstRow.length > 4)) {
      secCol = 4;
    }

    // Scan batch for unambiguous date format hint (e.g. M/D/YYYY vs D/M/YYYY)
    let batchDateFormat = null;
    for (const r of dataRows) {
      const raw = String(r[dobCol] || '').trim();
      const m = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (m) {
        const p1 = parseInt(m[1], 10);
        const p2 = parseInt(m[2], 10);
        if (p2 > 12 && p1 <= 12) {
          batchDateFormat = 'MDY';
          break;
        } else if (p1 > 12 && p2 <= 12) {
          batchDateFormat = 'DMY';
          break;
        }
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const seenInBatch = new Set();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + startRowNum;

      const rawRegNo = row[regCol];
      const cleanRegNo = cleanRegisterNo(rawRegNo);
      const name = String(row[nameCol] || '').trim();
      const rawDob = row[dobCol];
      const rawYear = yearCol !== -1 ? row[yearCol] : undefined;
      const rawSec = secCol !== -1 ? row[secCol] : undefined;

      if (!cleanRegNo || !name || rawDob === undefined || rawDob === '') {
        errors.push(`Row ${rowNum}: Missing required fields (Register Number, Name, or DOB).`);
        skippedCount++;
        continue;
      }

      if (!validateRegisterNo(cleanRegNo)) {
        errors.push(`Row ${rowNum}: Invalid Register Number format (${cleanRegNo}).`);
        skippedCount++;
        continue;
      }

      if (seenInBatch.has(cleanRegNo.toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate Register Number (${cleanRegNo}) in spreadsheet.`);
        skippedCount++;
        continue;
      }
      seenInBatch.add(cleanRegNo.toLowerCase());

      const dob = normalizeDob(rawDob, batchDateFormat);
      if (!dob) {
        errors.push(`Row ${rowNum}: Invalid DOB for ${cleanRegNo}. Please provide a valid calendar date.`);
        skippedCount++;
        continue;
      }

      // Optional Year validation (1-4 if provided, otherwise null)
      let year = null;
      if (rawYear !== undefined && rawYear !== null && String(rawYear).trim() !== '') {
        const parsedYear = parseInt(String(rawYear).trim(), 10);
        if ([1, 2, 3, 4].includes(parsedYear)) {
          year = parsedYear;
        } else {
          errors.push(`Row ${rowNum}: Year must be between 1 and 4 for ${cleanRegNo}.`);
          skippedCount++;
          continue;
        }
      }

      // Optional Section validation (A-D if provided, otherwise null)
      let section = null;
      if (rawSec !== undefined && rawSec !== null && String(rawSec).trim() !== '') {
        const parsedSec = String(rawSec).trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(parsedSec)) {
          section = parsedSec;
        } else {
          errors.push(`Row ${rowNum}: Section must be A, B, C, or D for ${cleanRegNo}.`);
          skippedCount++;
          continue;
        }
      }

      const pwdString = dobToPasswordString(dob);
      const hashedPassword = await bcrypt.hash(pwdString, 10);

      // Check if student exists in database
      const [existing] = await pool.query(
        'SELECT id, name, is_locked FROM students WHERE register_no = ?',
        [cleanRegNo]
      );

      if (existing.length > 0) {
        const existingStudent = existing[0];
        if (existingStudent.is_locked) {
          errors.push(`Row ${rowNum}: Student ${cleanRegNo} is locked by admin; update skipped.`);
          skippedCount++;
          continue;
        }

        // Sync and update student record for login purpose (preserve existing year/section if row doesn't provide them)
        try {
          await pool.query(
            `UPDATE students 
             SET name = ?, dob = ?, password = ?, year = COALESCE(?, year), section = COALESCE(?, section)
             WHERE id = ?`,
            [name, dob, hashedPassword, year, section, existingStudent.id]
          );
          updatedCount++;
        } catch (err) {
          console.error(`[bulkImport DB Update Error row ${rowNum}]:`, err);
          errors.push(`Row ${rowNum}: Database update error for ${cleanRegNo}.`);
          skippedCount++;
        }
      } else {
        // Insert new student record (year and section can be NULL)
        try {
          await pool.query(
            `INSERT INTO students (register_no, name, dob, password, year, section, status, is_locked)
             VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 0)`,
            [cleanRegNo, name, dob, hashedPassword, year, section]
          );
          insertedCount++;
        } catch (err) {
          console.error(`[bulkImport DB Insert Error row ${rowNum}]:`, err);
          errors.push(`Row ${rowNum}: Database insertion error for ${cleanRegNo}.`);
          skippedCount++;
        }
      }
    }

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'BULK_IMPORT',
      details: `Bulk imported students: ${insertedCount} added, ${updatedCount} updated, ${skippedCount} skipped.`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Bulk import completed: ${insertedCount} new added, ${updatedCount} existing updated, ${skippedCount} skipped.`,
      insertedCount,
      updatedCount,
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

/**
 * Shared helper to clean up student documents & photo from storage and local uploads folder
 */
const cleanupStudentFiles = async (studentId, photoPath) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  try {
    const [docs] = await pool.query(
      'SELECT file_path FROM student_documents WHERE student_id = ?',
      [studentId]
    );

    for (const doc of docs) {
      if (doc.file_path) {
        const filename = path.basename(doc.file_path);
        try {
          await deleteObject(filename);
        } catch (e) {
          console.warn(`[Storage cleanup warning for doc ${filename}]:`, e.message);
        }
        const absPath = path.join(uploadsDir, filename);
        if (fs.existsSync(absPath)) {
          try {
            fs.unlinkSync(absPath);
          } catch (e) {
            console.warn(`[Disk cleanup warning for doc ${filename}]:`, e.message);
          }
        }
      }
    }

    if (photoPath) {
      const photoName = path.basename(photoPath);
      try {
        await deleteObject(photoName);
      } catch (e) {
        console.warn(`[Storage cleanup warning for photo ${photoName}]:`, e.message);
      }
      const photoAbsPath = path.join(uploadsDir, photoName);
      if (fs.existsSync(photoAbsPath)) {
        try {
          fs.unlinkSync(photoAbsPath);
        } catch (e) {
          console.warn(`[Disk cleanup warning for photo ${photoName}]:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error(`[cleanupStudentFiles error for student ${studentId}]:`, err.message);
  }
};

/**
 * Reusable helper to build student SQL WHERE clause and parameters from query/filter object
 */
const buildStudentFilter = (query = {}) => {
  const conditions = [];
  const params = [];

  const search = toSafeString(query.search).trim();
  const section = toSafeString(query.section).trim().toUpperCase();
  const status = toSafeString(query.status).trim().toUpperCase();
  const { firstGraduate, pms, lockState } = query;

  if (search) {
    conditions.push('(register_no LIKE ? OR name LIKE ? OR mobile LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (query.year !== undefined && query.year !== null && query.year !== '') {
    const yearNum = parseInt(Array.isArray(query.year) ? query.year[0] : query.year, 10);
    if (Number.isFinite(yearNum) && [1, 2, 3, 4].includes(yearNum)) {
      conditions.push('year = ?');
      params.push(yearNum);
    }
  }

  if (query.semester !== undefined && query.semester !== null && query.semester !== '') {
    const semNum = parseInt(Array.isArray(query.semester) ? query.semester[0] : query.semester, 10);
    if (Number.isFinite(semNum) && semNum >= 1 && semNum <= 8) {
      conditions.push('current_semester = ?');
      params.push(semNum);
    }
  }

  if (section && ['A', 'B', 'C', 'D'].includes(section)) {
    conditions.push('section = ?');
    params.push(section);
  }

  if (firstGraduate !== undefined && firstGraduate !== null && firstGraduate !== '') {
    conditions.push('is_first_graduate = ?');
    params.push(firstGraduate === 'true' || firstGraduate === '1' || firstGraduate === 1 ? 1 : 0);
  }

  if (pms !== undefined && pms !== null && pms !== '') {
    conditions.push('is_pms = ?');
    params.push(pms === 'true' || pms === '1' || pms === 1 ? 1 : 0);
  }

  if (status && ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(status)) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (lockState === 'locked' || lockState === 'true' || lockState === 1 || lockState === '1') {
    conditions.push('is_locked = 1');
  } else if (lockState === 'unlocked' || lockState === 'false' || lockState === 0 || lockState === '0') {
    conditions.push('is_locked = 0');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params, hasFilters: conditions.length > 0 };
};

/**
 * Permanently delete student record, uploaded documents, and login
 */
const deleteStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const [rows] = await pool.query(
      'SELECT id, register_no, name, photo_path FROM students WHERE id = ?',
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = rows[0];

    // Clean up all uploaded documents and photo from storage & disk
    await cleanupStudentFiles(studentId, student.photo_path);

    // Delete documents and student record atomically within a database transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM student_documents WHERE student_id = ?', [studentId]);
      await conn.query('DELETE FROM students WHERE id = ?', [studentId]);
      await conn.commit();
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE_STUDENT',
      studentId: null,
      studentRegNo: student.register_no,
      details: `Permanently deleted student record & login for ${student.name} (${student.register_no})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Student ${student.name} (${student.register_no}) and all associated records have been permanently deleted.`
    });
  } catch (error) {
    console.error('[deleteStudent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete student record.' });
  }
};

/**
 * Preview bulk students matching filter criteria
 * POST /api/admin/students/bulk/preview
 * Body: { filters }
 */
const previewBulkStudents = async (req, res) => {
  try {
    const filters = req.body?.filters || {};
    const { whereClause, params } = buildStudentFilter(filters);

    // Fetch total matching count & how many of them are currently locked
    const [countRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) AS locked_count
       FROM students ${whereClause}`,
      params
    );

    const count = Number(countRows[0]?.total) || 0;
    const lockedCount = Number(countRows[0]?.locked_count) || 0;

    // Fetch sample (up to first 10 students matching criteria: id, register_no, name, year, section, status, is_locked)
    const [sampleRows] = await pool.query(
      `SELECT id, register_no, name, year, current_semester, section, status, is_locked
       FROM students
       ${whereClause}
       ORDER BY register_no ASC
       LIMIT 10`,
      params
    );

    const sample = sampleRows.map((s) => ({
      id: s.id,
      register_no: s.register_no,
      name: s.name,
      year: s.year,
      current_semester: s.current_semester,
      section: s.section,
      status: s.status,
      is_locked: Boolean(s.is_locked)
    }));

    return res.json({
      success: true,
      count,
      lockedCount,
      sample
    });
  } catch (error) {
    console.error('[previewBulkStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to preview bulk students.' });
  }
};

/**
 * Bulk lock or unlock students by filter criteria or explicit IDs
 * PATCH /api/admin/students/bulk/lock
 * Body: { filters OR ids, lock: true|false, confirm: true, allowAll: false }
 */
const bulkLockStudents = async (req, res) => {
  try {
    const { ids, filters, lock, allowAll } = req.body;

    if (typeof lock !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing "lock" parameter. Must be boolean true or false.'
      });
    }

    let targetStudents = [];

    if (Array.isArray(ids)) {
      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No student IDs provided for bulk lock.' });
      }
      if (ids.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 500 student IDs can be updated in a single bulk operation.'
        });
      }
      const validIds = ids.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id) && id > 0);
      if (validIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid student IDs provided.' });
      }

      const placeholders = validIds.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT id, register_no, is_locked FROM students WHERE id IN (${placeholders})`,
        validIds
      );
      targetStudents = rows;
    } else if (filters && typeof filters === 'object') {
      const { whereClause, params, hasFilters } = buildStudentFilter(filters);
      if (!hasFilters && !allowAll) {
        return res.status(400).json({
          success: false,
          message: 'No filter applied. Bulk locking the entire student body requires explicit allowAll: true confirmation.'
        });
      }

      const [rows] = await pool.query(
        `SELECT id, register_no, is_locked FROM students ${whereClause} ORDER BY id ASC LIMIT 501`,
        params
      );

      if (rows.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Matched cohort exceeds safe cap of 500 students. Please refine your filter.'
        });
      }
      targetStudents = rows;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either "ids" array or "filters" object must be provided.'
      });
    }

    if (targetStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'No matching student records found to update.' });
    }

    const targetLockVal = lock ? 1 : 0;
    const lockedAt = lock ? new Date() : null;
    const lockedBy = lock ? req.user.username : null;

    // Skip rows already in target state
    const studentsToUpdate = targetStudents.filter((s) => Boolean(s.is_locked) !== lock);
    const skipped = targetStudents.length - studentsToUpdate.length;
    let affected = 0;

    // Process in safe chunks of 100
    const chunkSize = 100;
    const updateIds = studentsToUpdate.map((s) => s.id);

    for (let i = 0; i < updateIds.length; i += chunkSize) {
      const chunk = updateIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      const [result] = await pool.query(
        `UPDATE students 
         SET is_locked = ?, locked_at = ?, locked_by = ? 
         WHERE id IN (${placeholders})`,
        [targetLockVal, lockedAt, lockedBy, ...chunk]
      );
      affected += result.affectedRows || chunk.length;
    }

    const action = lock ? 'BULK_LOCK' : 'BULK_UNLOCK';
    const regList = targetStudents.map((s) => s.register_no);
    const regSummary = regList.slice(0, 25).join(', ') + (regList.length > 25 ? ` (+${regList.length - 25} more)` : '');

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action,
      details: `${action}: ${affected} updated, ${skipped} skipped (already in state). Filters: ${JSON.stringify(filters || {})}. Register numbers: [${regSummary}]`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Bulk ${lock ? 'LOCK' : 'UNLOCK'} completed: ${affected} student records updated, ${skipped} skipped.`,
      affected,
      skipped,
      failed: 0
    });
  } catch (error) {
    console.error('[bulkLockStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute bulk lock operation.' });
  }
};

/**
 * Bulk delete students by filter criteria or explicit IDs
 * DELETE /api/admin/students/bulk
 * Body: { filters OR ids, confirmText: "DELETE", allowAll: false }
 */
const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids, filters, confirmText, allowAll } = req.body;

    if (confirmText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation keyword "DELETE" is required to authorize bulk deletion.'
      });
    }

    let targetStudents = [];

    if (Array.isArray(ids)) {
      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No student IDs provided for bulk deletion.' });
      }
      if (ids.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 500 student IDs can be deleted in a single bulk operation.'
        });
      }
      const validIds = ids.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id) && id > 0);
      if (validIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid student IDs provided.' });
      }

      const placeholders = validIds.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT id, register_no, name, photo_path FROM students WHERE id IN (${placeholders})`,
        validIds
      );
      targetStudents = rows;
    } else if (filters && typeof filters === 'object') {
      const { whereClause, params, hasFilters } = buildStudentFilter(filters);
      if (!hasFilters && !allowAll) {
        return res.status(400).json({
          success: false,
          message: 'No filter applied. Bulk deleting the entire student body requires explicit allowAll: true confirmation.'
        });
      }

      const [rows] = await pool.query(
        `SELECT id, register_no, name, photo_path FROM students ${whereClause} ORDER BY id ASC LIMIT 501`,
        params
      );

      if (rows.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Matched cohort exceeds safe cap of 500 students. Please refine your filter.'
        });
      }
      targetStudents = rows;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either "ids" array or "filters" object must be provided.'
      });
    }

    if (targetStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'No matching student records found to delete.' });
    }

    const allIds = targetStudents.map((s) => s.id);
    const regList = targetStudents.map((s) => s.register_no);
    const chunkSize = 100;

    // Run database deletes within ONE transaction with rollback on failure
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        await conn.query(`DELETE FROM student_documents WHERE student_id IN (${placeholders})`, chunk);
        await conn.query(`DELETE FROM students WHERE id IN (${placeholders})`, chunk);
      }

      await conn.commit();
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    // Clean up uploaded documents and photos from storage and disk
    // Storage cleanup failures are logged and will not abort the batch
    for (const student of targetStudents) {
      await cleanupStudentFiles(student.id, student.photo_path).catch((err) => {
        console.warn(`[Bulk delete cleanup warning for ${student.register_no}]:`, err.message);
      });
    }

    const regSummary = regList.slice(0, 25).join(', ') + (regList.length > 25 ? ` (+${regList.length - 25} more)` : '');
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'BULK_DELETE',
      details: `Bulk deleted ${targetStudents.length} students & documents. Filters: ${JSON.stringify(filters || {})}. Register numbers: [${regSummary}]`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Permanently deleted ${targetStudents.length} student records and associated documents.`,
      affected: targetStudents.length,
      skipped: 0,
      failed: 0
    });
  } catch (error) {
    console.error('[bulkDeleteStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute bulk delete operation.' });
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
  getAuditLogs,
  deleteStudent,
  buildStudentFilter,
  previewBulkStudents,
  bulkLockStudents,
  bulkDeleteStudents
};


