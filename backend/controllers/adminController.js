const bcrypt = require('bcryptjs');

// Low 4 fix: Safe escape for SQL LIKE wildcard characters
const escapeLikePattern = (str) => String(str || '').replace(/[%_\\]/g, (char) => `\\${char}`);
const crypto = require('crypto');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { sendStatusEmail, sendLockEmail } = require('../utils/emailEvents');
const { deleteObject, deleteObjects } = require('../config/storage');
const {
  cleanRegisterNo,
  isScientificNotation,
  validateRegisterNo,
  validateEmail,
  validateMobile,
  validateAadhaar,
  validateIfsc,
  validatePincode,
  maskAadhaar,
  maskBankAcc,
  dobToPasswordString,
  normalizeDob,
  formatDisplayDob,
  validateStudentAge
} = require('../utils/validators');
const { logAdminAction } = require('../utils/auditLogger');
const { validateSpreadsheetBuffer } = require('../utils/fileSecurity');
const { invalidateTokenCache } = require('../middleware/authMiddleware');
const { decrypt } = require('../utils/fieldCrypto');
const { clearFailures } = require('../utils/lockout');

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

    const [whitelistCounts] = await pool.query(`
      SELECT 
        COUNT(*) AS total_whitelist,
        SUM(CASE WHEN is_claimed = 0 THEN 1 ELSE 0 END) AS unclaimed_whitelist,
        SUM(CASE WHEN is_claimed = 1 THEN 1 ELSE 0 END) AS claimed_whitelist
      FROM student_whitelist
    `).catch(() => [[{ total_whitelist: 0, unclaimed_whitelist: 0, claimed_whitelist: 0 }]]);

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
        totalWhitelist: Number(whitelistCounts[0]?.total_whitelist) || 0,
        unclaimedWhitelist: Number(whitelistCounts[0]?.unclaimed_whitelist) || 0,
        claimedWhitelist: Number(whitelistCounts[0]?.claimed_whitelist) || 0,
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
      const term = `%${escapeLikePattern(search)}%`;
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
      aadhaar_no: maskAadhaar(s.aadhaar_no ? decrypt(s.aadhaar_no) : s.aadhaar_no),
      bank_acc_no: maskBankAcc(s.bank_acc_no ? decrypt(s.bank_acc_no) : s.bank_acc_no)
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
 * Pre-register a single student to whitelist (Requirement G)
 * Admin inputs Register Number and Date of Birth
 */
const addStudent = async (req, res) => {
  try {
    const { registerNo, dob } = req.body;

    const regNo = cleanRegisterNo(toSafeString(registerNo));
    const normalizedDob = normalizeDob(dob);

    if (!regNo || !normalizedDob) {
      return res.status(400).json({
        success: false,
        message: 'Valid Register Number and Date of Birth (DOB) are required.'
      });
    }

    if (!validateRegisterNo(regNo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Register Number format.'
      });
    }

    if (!validateStudentAge(normalizedDob, 15, 40)) {
      return res.status(400).json({
        success: false,
        message: 'Date of Birth must represent a student age between 15 and 40.'
      });
    }

    // Check if student already registered account in students table
    const [existingStudent] = await pool.query(
      'SELECT id, name FROM students WHERE LOWER(register_no) = LOWER(?)',
      [regNo]
    );
    if (existingStudent.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Student with Register Number ${regNo} has already created an account.`
      });
    }

    // Check whitelist table
    const [existingWhitelist] = await pool.query(
      'SELECT id, dob, is_claimed FROM student_whitelist WHERE LOWER(register_no) = LOWER(?)',
      [regNo]
    );

    if (existingWhitelist.length > 0) {
      const entry = existingWhitelist[0];

      if (entry.is_claimed) {
        return res.status(409).json({
          success: false,
          code: 'ALREADY_REGISTERED',
          message: `Student with Register Number ${regNo} has already created an account.`
        });
      }

      // If already on the whitelist with the identical Date of Birth, block duplicate addition
      if (entry.dob === normalizedDob) {
        return res.status(409).json({
          success: false,
          code: 'ALREADY_WHITELISTED',
          message: `Register Number ${regNo} is already imported in the whitelist.`
        });
      }

      // If on the whitelist with a different DOB, require explicit overwrite approval
      if (!req.body.overwrite) {
        return res.status(409).json({
          success: false,
          code: 'DOB_MISMATCH',
          existingDob: entry.dob,
          message: `Register Number ${regNo} is already imported in the whitelist with Date of Birth (${formatDisplayDob(entry.dob)}) [DD/MM/YYYY].`
        });
      }

      // Re-enable candidate / update DOB on explicit overwrite
      await pool.query(
        'UPDATE student_whitelist SET dob = ?, is_claimed = 0, claimed_student_id = NULL, updated_at = NOW() WHERE id = ?',
        [normalizedDob, entry.id]
      );

      // Clear any lockout records from previous verification failures
      await clearFailures(`verify:${regNo}`);
      await clearFailures(`login:student:${regNo}`);

      await logAdminAction({
        adminId: req.user.id,
        adminUsername: req.user.username,
        action: 'UPDATE_WHITELIST_STUDENT',
        studentRegNo: regNo,
        details: `Updated whitelist DOB to (${normalizedDob}) for candidate ${regNo}`,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: `Student ${regNo} whitelist record updated with Date of Birth (${formatDisplayDob(normalizedDob)}) [DD/MM/YYYY]. Candidate can now create their account.`
      });
    }

    // Insert new record into student_whitelist
    await pool.query(
      'INSERT INTO student_whitelist (register_no, dob, is_claimed) VALUES (?, ?, 0)',
      [regNo, normalizedDob]
    );

    // Clear any lockout records
    await clearFailures(`verify:${regNo}`);
    await clearFailures(`login:student:${regNo}`);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'ADD_WHITELIST_STUDENT',
      studentRegNo: regNo,
      details: `Pre-registered candidate ${regNo} to eligibility whitelist.`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Candidate ${regNo} pre-registered to whitelist. They can now create their account on the portal.`
    });
  } catch (error) {
    console.error('[addStudent Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to add student to whitelist.' });
  }
};

/**
 * Helper to parse whitelist spreadsheet buffer
 * Accepts .xlsx, .xls, .csv
 * Expected columns: Register Number and DOB
 */
const parseWhitelistSpreadsheet = (fileBuf, originalname) => {
  const magicCheck = validateSpreadsheetBuffer(fileBuf, originalname);
  if (!magicCheck.valid) {
    return { error: magicCheck.error };
  }

  const workbook = xlsx.read(fileBuf, {
    type: 'buffer',
    cellDates: true,
    cellFormula: false,
    cellHTML: false,
    cellText: false
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { error: 'Spreadsheet has no sheets.' };
  }

  const allRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
  const nonEmptyRows = allRows.filter(row => Array.isArray(row) && row.some(cell => String(cell).trim() !== ''));

  if (!nonEmptyRows || nonEmptyRows.length === 0) {
    return { error: 'The uploaded spreadsheet is empty.' };
  }

  const firstRow = nonEmptyRows[0];
  const hasHeaderWords = firstRow.some(cell =>
    /reg(ister)?|roll|dob|birth|date/i.test(String(cell).trim())
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
    return { error: 'The uploaded spreadsheet contains headers but no student records.' };
  }

  if (dataRows.length > 5000) {
    return { error: 'Spreadsheet exceeds the maximum limit of 5000 rows.' };
  }

  let regCol = -1;
  let dobCol = -1;
  let emailCol = -1;

  if (headerRow) {
    headerRow.forEach((cell, idx) => {
      const header = String(cell).trim();
      if (regCol === -1 && /^(reg(ister)?([_\s]?no|\.?)?|roll([_\s]?no|\.?)?|student([_\s]?(id|no))?|admission([_\s]?no)?)$/i.test(header)) {
        regCol = idx;
      } else if (regCol === -1 && /reg|roll|student_?id/i.test(header)) {
        regCol = idx;
      }

      if (dobCol === -1 && /^(dob|date([_\s]?of[_\s]?birth)?|birth([_\s]?date)?)$/i.test(header)) {
        dobCol = idx;
      } else if (dobCol === -1 && /dob|birth/i.test(header)) {
        dobCol = idx;
      }

      if (emailCol === -1 && /^(email|e-mail|mail([_\s]?id)?)$/i.test(header)) {
        emailCol = idx;
      } else if (emailCol === -1 && /email|mail/i.test(header)) {
        emailCol = idx;
      }
    });
  }

  if (regCol === -1) regCol = 0;
  if (dobCol === -1) dobCol = 1;

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

  const validRows = [];
  const errors = [];
  const seenInBatch = new Set();
  const seenEmailsInBatch = new Map();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + startRowNum;

    const rawRegNo = row[regCol];
    const rawDob = row[dobCol];
    const rawEmail = emailCol !== -1 ? String(row[emailCol] || '').trim().toLowerCase() : null;

    if (isScientificNotation(rawRegNo)) {
      errors.push({
        row: rowNum,
        error: `Row ${rowNum}: Register number "${rawRegNo}" is formatted in scientific notation (e.g. 8.20E+11). Please format the column as Text/Number without decimals in Excel before uploading.`
      });
      continue;
    }

    const cleanRegNo = cleanRegisterNo(rawRegNo);

    if (!cleanRegNo || rawDob === undefined || rawDob === '') {
      errors.push({ row: rowNum, error: `Row ${rowNum}: Missing Register Number or DOB.` });
      continue;
    }

    if (!validateRegisterNo(cleanRegNo)) {
      errors.push({ row: rowNum, error: `Row ${rowNum}: Invalid Register Number format (${cleanRegNo}).` });
      continue;
    }

    if (seenInBatch.has(cleanRegNo.toLowerCase())) {
      errors.push({ row: rowNum, error: `Row ${rowNum}: Duplicate Register Number (${cleanRegNo}) in file.` });
      continue;
    }
    seenInBatch.add(cleanRegNo.toLowerCase());

    if (rawEmail) {
      if (!validateEmail(rawEmail)) {
        errors.push({ row: rowNum, error: `Row ${rowNum}: Invalid email format (${rawEmail}) for ${cleanRegNo}.` });
        continue;
      }
      if (seenEmailsInBatch.has(rawEmail)) {
        const prevReg = seenEmailsInBatch.get(rawEmail);
        errors.push({
          row: rowNum,
          error: `Row ${rowNum}: Duplicate Email address (${rawEmail}) in file (already assigned to Register Number ${prevReg}).`
        });
        continue;
      }
      seenEmailsInBatch.set(rawEmail, cleanRegNo);
    }

    const dob = normalizeDob(rawDob, batchDateFormat);
    if (!dob) {
      errors.push({ row: rowNum, error: `Row ${rowNum}: Invalid DOB for ${cleanRegNo}. Please provide a valid calendar date.` });
      continue;
    }

    if (!validateStudentAge(dob, 15, 40)) {
      errors.push({ row: rowNum, error: `Row ${rowNum}: DOB must represent a student age between 15 and 40 for ${cleanRegNo}.` });
      continue;
    }

    validRows.push({
      rowNum,
      registerNo: cleanRegNo,
      dob,
      email: rawEmail || null
    });
  }

  return {
    totalRows: dataRows.length,
    validRows,
    errors
  };
};

/**
 * Bulk import student eligibility whitelist from Excel or CSV
 * Whitelist only: does NOT create full student user accounts.
 * Inserts new unclaimed whitelist records, updates DOB if unclaimed, skips already registered.
 */
const bulkImportStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
  }

  const filePath = req.file.path;
  const conn = await pool.getConnection();
  try {
    const fileBuf = fs.readFileSync(filePath);
    const parsed = parseWhitelistSpreadsheet(fileBuf, req.file.originalname);
    if (parsed.error) {
      conn.release();
      return res.status(400).json({ success: false, message: parsed.error });
    }

    if (parsed.validRows.length === 0) {
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'No valid records found in spreadsheet.',
        errors: parsed.errors.map(e => e.error).slice(0, 15)
      });
    }

    await conn.beginTransaction();

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [...parsed.errors.map(e => e.error)];

    // B8 fix: Bulk fetch existing whitelist, student records, and email bindings in batches
    const regNos = parsed.validRows.map(r => r.registerNo);
    const emails = parsed.validRows.map(r => r.email).filter(Boolean);
    const existingWlMap = new Map();
    const existingStudentMap = new Map();
    const existingStudentByEmailMap = new Map();
    const existingWlByEmailMap = new Map();
    const BATCH_SIZE = 500;

    for (let i = 0; i < regNos.length; i += BATCH_SIZE) {
      const chunk = regNos.slice(i, i + BATCH_SIZE);
      const ph = chunk.map(() => '?').join(',');

      const [wlRows] = await conn.query(
        `SELECT id, register_no, dob, email, is_claimed FROM student_whitelist WHERE register_no IN (${ph})`,
        chunk
      );
      wlRows.forEach(r => existingWlMap.set(r.register_no, r));

      const [stRows] = await conn.query(
        `SELECT id, register_no FROM students WHERE register_no IN (${ph})`,
        chunk
      );
      stRows.forEach(r => existingStudentMap.set(r.register_no, r));
    }

    if (emails.length > 0) {
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const chunk = emails.slice(i, i + BATCH_SIZE);
        const ph = chunk.map(() => '?').join(',');

        const [stEmailRows] = await conn.query(
          `SELECT id, register_no, email FROM students WHERE LOWER(email) IN (${ph})`,
          chunk
        );
        stEmailRows.forEach(r => existingStudentByEmailMap.set(r.email.toLowerCase(), r));

        const [wlEmailRows] = await conn.query(
          `SELECT id, register_no, email, is_claimed FROM student_whitelist WHERE LOWER(email) IN (${ph})`,
          chunk
        );
        wlEmailRows.forEach(r => existingWlByEmailMap.set(r.email.toLowerCase(), r));
      }
    }

    for (const item of parsed.validRows) {
      // Prevent binding an email that already belongs to another registered student or whitelist candidate
      if (item.email) {
        const emailLower = item.email.toLowerCase();
        const studentByEmail = existingStudentByEmailMap.get(emailLower);
        if (studentByEmail && studentByEmail.register_no.toLowerCase() !== item.registerNo.toLowerCase()) {
          errors.push(`Row ${item.rowNum}: Email (${item.email}) is already used by student ${studentByEmail.register_no}. Skipped.`);
          skippedCount++;
          continue;
        }

        const wlByEmail = existingWlByEmailMap.get(emailLower);
        if (wlByEmail && wlByEmail.register_no.toLowerCase() !== item.registerNo.toLowerCase()) {
          errors.push(`Row ${item.rowNum}: Email (${item.email}) is already assigned to whitelist candidate ${wlByEmail.register_no}. Skipped.`);
          skippedCount++;
          continue;
        }
      }

      const wl = existingWlMap.get(item.registerNo);

      if (wl) {
        if (wl.is_claimed) {
          skippedCount++;
          continue;
        }

        // Unclaimed: update DOB or email if changed
        const emailChanged = item.email && wl.email !== item.email;
        if (wl.dob !== item.dob || emailChanged) {
          await conn.query(
            'UPDATE student_whitelist SET dob = ?, email = COALESCE(?, email) WHERE id = ?',
            [item.dob, item.email || null, wl.id]
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const existingStudent = existingStudentMap.get(item.registerNo);

        if (existingStudent) {
          await conn.query(
            `INSERT INTO student_whitelist (register_no, dob, is_claimed, claimed_student_id)
             VALUES (?, ?, 1, ?)`,
            [item.registerNo, item.dob, existingStudent.id]
          );
          skippedCount++;
        } else {
          await conn.query(
            `INSERT INTO student_whitelist (register_no, dob, email, is_claimed)
             VALUES (?, ?, ?, 0)`,
            [item.registerNo, item.dob, item.email || null]
          );
          insertedCount++;
        }
      }
    }

    await conn.commit();

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'BULK_IMPORT',
      details: `Bulk imported student whitelist: ${insertedCount} added, ${updatedCount} updated, ${skippedCount} skipped.`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Whitelist import completed: ${insertedCount} new added, ${updatedCount} updated, ${skippedCount} skipped.`,
      insertedCount,
      updatedCount,
      skippedCount,
      errors: errors.slice(0, 15)
    });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rbErr) {
      // ignore
    }
    console.error('[bulkImportStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process bulk import.' });
  } finally {
    try {
      conn.release();
    } catch (relErr) {
      // ignore
    }
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
 * Preview bulk import whitelist file before committing
 * Returns totalRows, validCount, invalidCount, preview sample, and errors
 */
const previewBulkImport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx, .xls) or CSV file.' });
  }

  const filePath = req.file.path;
  try {
    const fileBuf = fs.readFileSync(filePath);
    const parsed = parseWhitelistSpreadsheet(fileBuf, req.file.originalname);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    // Determine prospective status for preview sample (first 25 rows)
    const sampleRows = parsed.validRows.slice(0, 25);
    const regList = sampleRows.map(r => r.registerNo);
    const emailList = sampleRows.map(r => r.email).filter(Boolean);

    let existingWlMap = new Map();
    let existingStudentSet = new Set();
    let existingStudentEmailMap = new Map();
    let existingWlEmailMap = new Map();

    if (regList.length > 0) {
      const placeholders = regList.map(() => '?').join(',');
      const [wlRows] = await pool.query(
        `SELECT register_no, dob, is_claimed FROM student_whitelist WHERE register_no IN (${placeholders})`,
        regList
      );
      wlRows.forEach(w => existingWlMap.set(w.register_no.toLowerCase(), w));

      const [stRows] = await pool.query(
        `SELECT register_no FROM students WHERE register_no IN (${placeholders})`,
        regList
      );
      stRows.forEach(s => existingStudentSet.add(s.register_no.toLowerCase()));
    }

    if (emailList.length > 0) {
      const emailPh = emailList.map(() => '?').join(',');
      const [stEmailRows] = await pool.query(
        `SELECT register_no, email FROM students WHERE LOWER(email) IN (${emailPh})`,
        emailList
      );
      stEmailRows.forEach(s => existingStudentEmailMap.set(s.email.toLowerCase(), s.register_no));

      const [wlEmailRows] = await pool.query(
        `SELECT register_no, email FROM student_whitelist WHERE LOWER(email) IN (${emailPh})`,
        emailList
      );
      wlEmailRows.forEach(w => existingWlEmailMap.set(w.email.toLowerCase(), w.register_no));
    }

    const preview = sampleRows.map(r => {
      const key = r.registerNo.toLowerCase();
      let status = 'NEW';
      if (r.email) {
        const eKey = r.email.toLowerCase();
        const takenByStudent = existingStudentEmailMap.get(eKey);
        const takenByWl = existingWlEmailMap.get(eKey);
        if ((takenByStudent && takenByStudent.toLowerCase() !== key) || (takenByWl && takenByWl.toLowerCase() !== key)) {
          status = 'EMAIL_IN_USE';
        }
      }
      if (status !== 'EMAIL_IN_USE') {
        if (existingStudentSet.has(key)) {
          status = 'ALREADY_REGISTERED';
        } else if (existingWlMap.has(key)) {
          const wl = existingWlMap.get(key);
          if (wl.is_claimed) {
            status = 'ALREADY_REGISTERED';
          } else if (wl.dob !== r.dob) {
            status = 'UPDATE_DOB';
          } else {
            status = 'EXISTS';
          }
        }
      }
      return {
        rowNum: r.rowNum,
        registerNo: r.registerNo,
        dob: r.dob,
        email: r.email || null,
        status
      };
    });

    return res.json({
      success: true,
      totalRows: parsed.totalRows,
      validCount: parsed.validRows.length,
      invalidCount: parsed.errors.length,
      preview,
      errors: parsed.errors.map(e => e.error).slice(0, 25)
    });
  } catch (error) {
    console.error('[previewBulkImport Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to preview bulk import file.' });
  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // ignore
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

    const currentLockState = Boolean(student[0].is_locked);
    const lockChanged = currentLockState !== lock;

    if (!lockChanged) {
      return res.json({
        success: true,
        message: `Student record is already ${lock ? 'LOCKED' : 'UNLOCKED'}.`,
        isLocked: currentLockState
      });
    }

    const newLockState = lock ? 1 : 0;
    const lockedAt = lock ? new Date() : null;
    const lockedBy = lock ? req.user.username : null;

    await pool.query(
      'UPDATE students SET is_locked = ?, locked_at = ?, locked_by = ?, token_version = token_version + ? WHERE id = ?',
      [newLockState, lockedAt, lockedBy, lock ? 1 : 0, studentId]
    );
    invalidateTokenCache('STUDENT', studentId);

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

    // E6/E7: Send lock/unlock email notification in background only when state changed
    if (lockChanged) {
      sendLockEmail(studentId, lock).catch(err => {
        console.error('[EmailEvents] sendLockEmail failed:', err.message);
      });
    }

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
 * Reset student's password:
 * Generates a random temporary password (e.g. Temp#...)
 * Sets must_change_password = 1, revokes existing sessions,
 * and returns tempPassword to show once to the admin.
 */
const resetStudentPassword = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);

    const [rows] = await pool.query('SELECT register_no, name FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = rows[0];
    // Low 3 fix: 64-bit entropy temporary password hashed with bcrypt work factor 12
    const tempPassword = `Temp#${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await pool.query(
      'UPDATE students SET password = ?, token_version = COALESCE(token_version, 1) + 1, must_change_password = 1 WHERE id = ?',
      [hashedPassword, studentId]
    );
    invalidateTokenCache('STUDENT', studentId);

    // Do NOT write the plain temporary password to audit log
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'RESET_PASSWORD',
      studentId,
      studentRegNo: student.register_no,
      details: `Generated temporary password for student ${student.name} (${student.register_no}) and flagged must_change_password`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Temporary password generated for ${student.name} (${student.register_no}).`,
      tempPassword
    });
  } catch (error) {
    console.error('[resetStudentPassword Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * Verify or Reject student profile
 */
const ALLOWED_STATUS_TRANSITIONS = {
  SUBMITTED: ['VERIFIED', 'REJECTED', 'DRAFT'],
  VERIFIED:  ['REJECTED', 'DRAFT', 'SUBMITTED'],
  REJECTED:  ['DRAFT', 'SUBMITTED', 'VERIFIED'],
  DRAFT:     ['DRAFT'] // a student must submit their own profile before verification
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

    const [rows] = await pool.query('SELECT register_no, name, status FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const currentStatus = rows[0].status;
    if (currentStatus !== status && (!ALLOWED_STATUS_TRANSITIONS[currentStatus] || !ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(status))) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition student status from ${currentStatus} to ${status}.`
      });
    }

    const boundedReason = typeof rejectionReason === 'string' ? rejectionReason.trim().slice(0, 500) : '';
    const finalReason = status === 'REJECTED' ? (boundedReason || 'Information incomplete') : null;

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
        finalReason,
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
      details: `Status updated from ${currentStatus} to ${status}${finalReason ? ` - Reason: ${finalReason}` : ''}`,
      ipAddress: req.ip
    });

    // E4/E5: Send status verified or rejected email in background only when status actually changes
    const statusChanged = currentStatus !== status;
    if (statusChanged && (status === 'VERIFIED' || status === 'REJECTED')) {
      sendStatusEmail(studentId, status, finalReason).catch(err => {
        console.error('[EmailEvents] sendStatusEmail failed:', err.message);
      });
    }

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
 * Collect every storage file key (documents and photos) belonging to the given students.
 * MUST be called BEFORE database rows in student_documents or students are deleted.
 */
const collectStudentFileKeys = async (students = []) => {
  const keys = new Set();
  const ids = students.map((s) => s.id).filter(Boolean);

  // Photos recorded directly on students table
  for (const s of students) {
    if (s.photo_path) {
      keys.add(path.basename(s.photo_path));
    }
  }

  if (ids.length === 0) return [...keys];

  // Documents recorded in student_documents (chunked to keep SQL query size bounded)
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => '?').join(',');
    const [docs] = await pool.query(
      `SELECT file_path FROM student_documents WHERE student_id IN (${placeholders})`,
      chunk
    );
    for (const d of docs) {
      if (d.file_path) {
        keys.add(path.basename(d.file_path));
      }
    }
  }

  return [...keys];
};

/**
 * Remove file keys from cloud object storage (Supabase / R2) and local uploads folder.
 * Never throws. Returns { deleted: number, failed: string[] }.
 */
const removeFileKeys = async (keys = []) => {
  const safeKeys = [...new Set(keys.filter(Boolean).map((k) => path.basename(k)))];
  if (safeKeys.length === 0) return { deleted: 0, failed: [] };

  // 1. Delete from Cloud Storage
  const storageResult = await deleteObjects(safeKeys);

  // 2. Delete local disk copies in uploads directory (if any)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  for (const key of safeKeys) {
    const absPath = path.join(uploadsDir, key);
    if (fs.existsSync(absPath)) {
      try {
        fs.unlinkSync(absPath);
      } catch (e) {
        console.warn(`[Disk cleanup warning for ${key}]:`, e.message);
      }
    }
  }

  return storageResult;
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
    const term = `%${escapeLikePattern(search)}%`;
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

    // 1. Pre-collect all document & photo keys while database rows still exist
    const fileKeys = await collectStudentFileKeys([student]);

    // 2. Delete documents and student record atomically within a database transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // B1 fix: Reset whitelist claimed status so student can re-register if needed
      await conn.query(
        'UPDATE student_whitelist SET is_claimed = 0, claimed_student_id = NULL WHERE LOWER(register_no) = LOWER(?) OR claimed_student_id = ?',
        [student.register_no, studentId]
      );
      await conn.query('DELETE FROM student_documents WHERE student_id = ?', [studentId]);
      await conn.query('DELETE FROM students WHERE id = ?', [studentId]);
      await conn.commit();
      await clearFailures(`verify:${student.register_no}`);
      await clearFailures(`login:student:${student.register_no}`);
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    // 3. Clean up storage and disk copies ONLY after DB commit succeeds
    const fileResult = await removeFileKeys(fileKeys);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE_STUDENT',
      studentId: null,
      studentRegNo: student.register_no,
      details:
        `Permanently deleted student record & login for ${student.name} (${student.register_no}). ` +
        `Files removed: ${fileResult.deleted}/${fileKeys.length}` +
        (fileResult.failed.length ? `. FAILED keys: ${fileResult.failed.join(', ')}` : ''),
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Student ${student.name} (${student.register_no}) and all associated records have been permanently deleted.` +
        (fileResult.failed.length ? ` Warning: ${fileResult.failed.length} file(s) could not be removed from storage.` : ''),
      filesRemoved: fileResult.deleted,
      filesFailed: fileResult.failed.length
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
         SET is_locked = ?, locked_at = ?, locked_by = ?, token_version = token_version + ? 
         WHERE id IN (${placeholders})`,
        [targetLockVal, lockedAt, lockedBy, lock ? 1 : 0, ...chunk]
      );
      chunk.forEach(id => invalidateTokenCache('STUDENT', id));
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

    // E6/E7: Send bulk lock/unlock emails in background
    if (Array.isArray(studentsToUpdate) && studentsToUpdate.length > 0) {
      studentsToUpdate.forEach(s => {
        sendLockEmail(s.id, lock).catch(err => {
          console.error('[EmailEvents] bulk sendLockEmail failed for student ' + s.id, err.message);
        });
      });
    }

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

    // 1. Pre-collect all document & photo keys BEFORE deleting database rows
    const fileKeys = await collectStudentFileKeys(targetStudents);

    // 2. Run database deletes within ONE transaction with rollback on failure
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize);
        const chunkRegs = regList.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        const regPlaceholders = chunkRegs.map(() => '?').join(',');
        // B1 fix: Reset whitelist claimed status so deleted students can re-register
        await conn.query(
          `UPDATE student_whitelist SET is_claimed = 0, claimed_student_id = NULL WHERE register_no IN (${regPlaceholders}) OR claimed_student_id IN (${placeholders})`,
          [...chunkRegs, ...chunk]
        );
        for (const reg of chunkRegs) {
          await clearFailures(`verify:${reg}`);
          await clearFailures(`login:student:${reg}`);
        }
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

    // 3. Clean up uploaded documents and photos from storage and disk
    const fileResult = await removeFileKeys(fileKeys);

    const regSummary = regList.slice(0, 25).join(', ') + (regList.length > 25 ? ` (+${regList.length - 25} more)` : '');
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'BULK_DELETE',
      details:
        `Bulk deleted ${targetStudents.length} students. ` +
        `Files removed: ${fileResult.deleted}/${fileKeys.length}. ` +
        `Filters: ${JSON.stringify(filters || {})}. Register numbers: [${regSummary}]` +
        (fileResult.failed.length ? `. FAILED keys (first 20): ${fileResult.failed.slice(0, 20).join(', ')}` : ''),
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Permanently deleted ${targetStudents.length} student records.` +
        (fileResult.failed.length
          ? ` Warning: ${fileResult.failed.length} file(s) could not be removed from storage and may need manual cleanup.`
          : ` ${fileResult.deleted} associated file(s) removed.`),
      affected: targetStudents.length,
      filesRemoved: fileResult.deleted,
      filesFailed: fileResult.failed.length,
      skipped: 0,
      failed: 0
    });
  } catch (error) {
    console.error('[bulkDeleteStudents Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute bulk delete operation.' });
  }
};

/**
 * Get imported student whitelist entries (Register numbers & DOB uploaded for eligibility)
 */
const getWhitelistEntries = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(100, toPositiveInt(req.query.limit, 20));
    const offset = (page - 1) * limit;
    const search = toSafeString(req.query.search).trim();
    const status = toSafeString(req.query.status).trim().toLowerCase(); // 'all', 'claimed', 'unclaimed'

    const conditions = [];
    const params = [];

    if (search) {
      const term = `%${escapeLikePattern(search)}%`;
      conditions.push('(w.register_no LIKE ? OR w.email LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }

    if (status === 'claimed') {
      conditions.push('w.is_claimed = 1');
    } else if (status === 'unclaimed') {
      conditions.push('w.is_claimed = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Aggregated summary stats (unfiltered so cards always show total cohort figures)
    const [statsRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN is_claimed = 1 THEN 1 ELSE 0 END) AS claimed,
        SUM(CASE WHEN is_claimed = 0 THEN 1 ELSE 0 END) AS unclaimed,
        SUM(CASE WHEN email IS NOT NULL AND TRIM(email) != '' THEN 1 ELSE 0 END) AS with_email
      FROM student_whitelist
    `);

    const rawStats = statsRows[0] || {};
    const stats = {
      total: Number(rawStats.total || 0),
      claimed: Number(rawStats.claimed || 0),
      unclaimed: Number(rawStats.unclaimed || 0),
      withEmail: Number(rawStats.with_email || 0)
    };

    // Filtered count for pagination
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM student_whitelist w 
      LEFT JOIN students s ON w.claimed_student_id = s.id 
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    // Filtered page rows
    const dataSql = `
      SELECT 
        w.id,
        w.register_no,
        w.dob,
        w.email,
        w.is_claimed,
        w.claimed_student_id,
        w.created_at,
        w.updated_at,
        s.name AS student_name,
        s.year AS student_year,
        s.section AS student_section,
        s.status AS student_status
      FROM student_whitelist w
      LEFT JOIN students s ON w.claimed_student_id = s.id
      ${whereClause}
      ORDER BY w.id DESC
      LIMIT ? OFFSET ?
    `;
    const [whitelist] = await pool.query(dataSql, [...params, limit, offset]);

    return res.json({
      success: true,
      whitelist,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('[getWhitelistEntries Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load whitelist entries.' });
  }
};

/**
 * Delete a student whitelist entry (e.g. erroneous register number or DOB uploaded)
 */
const deleteWhitelistEntry = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid whitelist entry ID.' });
    }

    const [rows] = await pool.query('SELECT * FROM student_whitelist WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Whitelist record not found.' });
    }

    const entry = rows[0];

    // Prevent deleting an entry that is currently linked to an active student account
    if (entry.is_claimed && entry.claimed_student_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete whitelist record for an already registered student. Delete the student from the Student Register tab first.'
      });
    }

    await pool.query('DELETE FROM student_whitelist WHERE id = ?', [id]);
    await clearFailures(`verify:${entry.register_no}`);

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE_WHITELIST_ENTRY',
      studentRegNo: entry.register_no,
      details: `Deleted whitelist record for Register No: ${entry.register_no} (DOB: ${entry.dob})`,
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: `Whitelist entry for register number ${entry.register_no} has been deleted.`
    });
  } catch (error) {
    console.error('[deleteWhitelistEntry Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete whitelist entry.' });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  addStudent,
  bulkImportStudents,
  previewBulkImport,
  toggleLockStudent,
  resetStudentPassword,
  updateStudentStatus,
  getAuditLogs,
  deleteStudent,
  buildStudentFilter,
  previewBulkStudents,
  bulkLockStudents,
  bulkDeleteStudents,
  getWhitelistEntries,
  deleteWhitelistEntry,
  parseWhitelistSpreadsheet
};


