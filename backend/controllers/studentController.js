const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const {
  validateMobile,
  validateAadhaar,
  validateIfsc,
  validatePincode,
  validateEmail
} = require('../utils/validators');

const ALLOWED_DOC_TYPES = [
  'photo',
  'aadhaar',
  'bank_passbook',
  'community_cert',
  'income_cert',
  'first_graduate_cert',
  'sslc_marksheet',
  'hsc_marksheet',
  'other'
];

// Helper to safely discard uploaded file on error
const discardUpload = (file) => {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.error('[discardUpload error]:', e);
    }
  }
};

// Safe parsing helpers
const parseSafeFloat = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const num = parseFloat(v);
  return Number.isFinite(num) ? num : null;
};

const parseSafeInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const num = parseInt(v, 10);
  return Number.isFinite(num) ? num : null;
};

const parseSafeString = (v) => {
  if (v === undefined || v === null) return null;
  return typeof v === 'string' ? v.trim() : String(v).trim();
};

/**
 * Get profile and documents of the student
 */
const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id ? parseInt(req.params.id, 10) : req.user.id;

    // Student can only access their own profile unless admin
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const [students] = await pool.query(
      `SELECT id, register_no, name, dob, year, section, gender, blood_group, religion, 
              community, caste, nationality, aadhaar_no, mother_tongue, photo_path,
              mobile, alt_mobile, email, permanent_address, communication_address, 
              is_same_address, district, state, pincode,
              father_name, mother_name, guardian_name, parents_occupation, parents_mobile, annual_income,
              sslc_school, sslc_board, sslc_year, sslc_percentage,
              hsc_school, hsc_board, hsc_year, hsc_percentage, current_semester, mode_of_admission,
              is_first_graduate, is_pms, pms_application_no, pms_status,
              other_scholarship_name, other_scholarship_amount, other_scholarship_status,
              community_cert_no, community_cert_issuer, community_cert_date,
              income_cert_no, income_cert_issuer, income_cert_date,
              bank_acc_holder, bank_name, bank_acc_no, bank_ifsc, bank_branch,
              status, is_locked, locked_at, locked_by, submission_date, rejection_reason, declaration_accepted,
              created_at, updated_at
       FROM students WHERE id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = students[0];

    // Fetch documents
    const [docs] = await pool.query(
      `SELECT id, doc_type, file_name, file_path, file_size, mime_type, uploaded_at 
       FROM student_documents WHERE student_id = ? ORDER BY uploaded_at ASC`,
      [studentId]
    );

    student.documents = docs;

    return res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('[getStudentProfile Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student profile.' });
  }
};

/**
 * Save / Update student details ("Save as draft" or step progress)
 */
const updateStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id ? parseInt(req.params.id, 10) : req.user.id;

    // Student can only update their own record unless admin
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check lock status
    const [existing] = await pool.query(
      'SELECT id, is_locked, status FROM students WHERE id = ?',
      [studentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (existing[0].is_locked && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Your profile has been locked by the department administrator. You cannot make further edits.'
      });
    }

    const d = req.body;
    const errors = {};

    // Validate year & section if provided
    let validYear = null;
    if (d.year !== undefined && d.year !== null && String(d.year).trim() !== '') {
      const parsedYear = parseInt(d.year, 10);
      if ([1, 2, 3, 4].includes(parsedYear)) {
        validYear = parsedYear;
      } else {
        errors.year = 'Year of study must be between 1 and 4.';
      }
    }

    let validSection = null;
    if (d.section !== undefined && d.section !== null && String(d.section).trim() !== '') {
      const parsedSec = String(d.section).trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(parsedSec)) {
        validSection = parsedSec;
      } else {
        errors.section = 'Section must be A, B, C, or D.';
      }
    }

    // Validate if provided
    if (d.mobile && !validateMobile(d.mobile)) {
      errors.mobile = 'Mobile number must be exactly 10 digits starting with 6-9.';
    }
    if (d.altMobile && !validateMobile(d.altMobile)) {
      errors.altMobile = 'Alternate mobile number must be exactly 10 digits starting with 6-9.';
    }
    if (d.email && !validateEmail(d.email)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (d.parentsMobile && !validateMobile(d.parentsMobile)) {
      errors.parentsMobile = 'Parents mobile number must be exactly 10 digits.';
    }
    if (d.aadhaarNo && !validateAadhaar(d.aadhaarNo)) {
      errors.aadhaarNo = 'Aadhaar number must be exactly 12 digits.';
    }
    if (d.pincode && !validatePincode(d.pincode)) {
      errors.pincode = 'Pincode must be exactly 6 digits.';
    }

    // Safe IFSC validation
    const safeIfsc = typeof d.bankIfsc === 'string' ? d.bankIfsc.trim().toUpperCase() : null;
    if (d.bankIfsc && !validateIfsc(d.bankIfsc)) {
      errors.bankIfsc = 'Invalid IFSC code format (e.g., SBIN0001234).';
    }

    // Safe number validations
    if (d.annualIncome !== undefined && d.annualIncome !== '' && d.annualIncome !== null) {
      if (parseSafeFloat(d.annualIncome) === null) {
        errors.annualIncome = 'Annual income must be a valid number.';
      }
    }
    if (d.sslcPercentage !== undefined && d.sslcPercentage !== '' && d.sslcPercentage !== null) {
      const p = parseSafeFloat(d.sslcPercentage);
      if (p === null || p < 0 || p > 100) {
        errors.sslcPercentage = 'SSLC percentage must be a number between 0 and 100.';
      }
    }
    if (d.hscPercentage !== undefined && d.hscPercentage !== '' && d.hscPercentage !== null) {
      const p = parseSafeFloat(d.hscPercentage);
      if (p === null || p < 0 || p > 100) {
        errors.hscPercentage = 'HSC percentage must be a number between 0 and 100.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for some fields.',
        errors
      });
    }

    // Invalidate status if student edits a VERIFIED or REJECTED record
    let updatedStatus = existing[0].status;
    let updatedRejectionReason = null;
    if (req.user.role !== 'ADMIN' && (existing[0].status === 'VERIFIED' || existing[0].status === 'REJECTED')) {
      updatedStatus = 'DRAFT';
      updatedRejectionReason = null;
    }

    // Helper to safely parse boolean values from string/number/boolean
    const parseSafeBoolean = (val) => {
      if (val === undefined || val === null) return null;
      if (val === true || val === 1 || val === 'true' || val === '1') return 1;
      if (val === false || val === 0 || val === 'false' || val === '0') return 0;
      return null;
    };

    const isSameAddressBool = parseSafeBoolean(d.isSameAddress);
    const commAddr = (isSameAddressBool === 1) ? d.permanentAddress : d.communicationAddress;

    // Field mapping definition: [bodyKey, dbColumn, parserFunction]
    const fieldDefinitions = [
      ['year', 'year', () => (validYear !== null ? validYear : null)],
      ['section', 'section', () => (validSection !== null ? validSection : null)],
      ['gender', 'gender', (v) => parseSafeString(v)],
      ['bloodGroup', 'blood_group', (v) => parseSafeString(v)],
      ['religion', 'religion', (v) => parseSafeString(v)],
      ['community', 'community', (v) => parseSafeString(v)],
      ['caste', 'caste', (v) => parseSafeString(v)],
      ['nationality', 'nationality', (v) => parseSafeString(v)],
      ['aadhaarNo', 'aadhaar_no', (v) => parseSafeString(v)],
      ['motherTongue', 'mother_tongue', (v) => parseSafeString(v)],

      ['mobile', 'mobile', (v) => parseSafeString(v)],
      ['altMobile', 'alt_mobile', (v) => parseSafeString(v)],
      ['email', 'email', (v) => parseSafeString(v)],
      ['permanentAddress', 'permanent_address', (v) => parseSafeString(v)],
      ['communicationAddress', 'communication_address', () => {
        if (isSameAddressBool === 1 && d.permanentAddress !== undefined) {
          return parseSafeString(d.permanentAddress);
        }
        return parseSafeString(d.communicationAddress);
      }],
      ['isSameAddress', 'is_same_address', () => (isSameAddressBool !== null ? isSameAddressBool : 0)],
      ['district', 'district', (v) => parseSafeString(v)],
      ['state', 'state', (v) => parseSafeString(v)],
      ['pincode', 'pincode', (v) => parseSafeString(v)],

      ['fatherName', 'father_name', (v) => parseSafeString(v)],
      ['motherName', 'mother_name', (v) => parseSafeString(v)],
      ['guardianName', 'guardian_name', (v) => parseSafeString(v)],
      ['parentsOccupation', 'parents_occupation', (v) => parseSafeString(v)],
      ['parentsMobile', 'parents_mobile', (v) => parseSafeString(v)],
      ['annualIncome', 'annual_income', (v) => parseSafeFloat(v)],

      ['sslcSchool', 'sslc_school', (v) => parseSafeString(v)],
      ['sslcBoard', 'sslc_board', (v) => parseSafeString(v)],
      ['sslcYear', 'sslc_year', (v) => parseSafeInt(v)],
      ['sslcPercentage', 'sslc_percentage', (v) => parseSafeFloat(v)],
      ['hscSchool', 'hsc_school', (v) => parseSafeString(v)],
      ['hscBoard', 'hsc_board', (v) => parseSafeString(v)],
      ['hscYear', 'hsc_year', (v) => parseSafeInt(v)],
      ['hscPercentage', 'hsc_percentage', (v) => parseSafeFloat(v)],
      ['currentSemester', 'current_semester', (v) => parseSafeInt(v)],
      ['modeOfAdmission', 'mode_of_admission', (v) => parseSafeString(v)],

      ['isFirstGraduate', 'is_first_graduate', (v) => parseSafeBoolean(v)],
      ['isPms', 'is_pms', (v) => parseSafeBoolean(v)],
      ['pmsApplicationNo', 'pms_application_no', (v) => parseSafeString(v)],
      ['pmsStatus', 'pms_status', (v) => parseSafeString(v)],
      ['otherScholarshipName', 'other_scholarship_name', (v) => parseSafeString(v)],
      ['otherScholarshipAmount', 'other_scholarship_amount', (v) => parseSafeFloat(v)],
      ['otherScholarshipStatus', 'other_scholarship_status', (v) => parseSafeString(v)],
      ['communityCertNo', 'community_cert_no', (v) => parseSafeString(v)],
      ['communityCertIssuer', 'community_cert_issuer', (v) => parseSafeString(v)],
      ['communityCertDate', 'community_cert_date', (v) => (parseSafeString(v) || null)],
      ['incomeCertNo', 'income_cert_no', (v) => parseSafeString(v)],
      ['incomeCertIssuer', 'income_cert_issuer', (v) => parseSafeString(v)],
      ['incomeCertDate', 'income_cert_date', (v) => (parseSafeString(v) || null)],

      ['bankAccHolder', 'bank_acc_holder', (v) => parseSafeString(v)],
      ['bankName', 'bank_name', (v) => parseSafeString(v)],
      ['bankAccNo', 'bank_acc_no', (v) => parseSafeString(v)],
      ['bankIfsc', 'bank_ifsc', () => (safeIfsc || null)],
      ['bankBranch', 'bank_branch', (v) => parseSafeString(v)],
    ];

    const shouldUpdateField = (key) => {
      if (key === 'communicationAddress') {
        return d.communicationAddress !== undefined || (isSameAddressBool === 1 && d.permanentAddress !== undefined);
      }
      return d[key] !== undefined;
    };

    const setClauses = [];
    const values = [];

    for (const [key, col, parser] of fieldDefinitions) {
      if (shouldUpdateField(key)) {
        setClauses.push(`${col} = ?`);
        values.push(parser(d[key]));
      }
    }

    setClauses.push('status = ?');
    values.push(updatedStatus);

    setClauses.push("rejection_reason = CASE WHEN ? = 'DRAFT' THEN NULL ELSE rejection_reason END");
    values.push(updatedStatus);

    values.push(studentId);

    const updateQuery = `UPDATE students SET ${setClauses.join(', ')} WHERE id = ?`;
    await pool.query(updateQuery, values);

    return res.json({
      success: true,
      message: 'Student details saved successfully.',
      status: updatedStatus
    });
  } catch (error) {
    console.error('[updateStudentDetails Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update student details.' });
  }
};

/**
 * Final Submission of the form (Step 8)
 */
const submitStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id ? parseInt(req.params.id, 10) : req.user.id;

    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { declarationAccepted } = req.body;

    if (!declarationAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You must check the declaration box to submit your information.'
      });
    }

    // Verify student is not locked and not already verified
    const [rows] = await pool.query(
      'SELECT is_locked, status FROM students WHERE id = ?',
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (rows[0].is_locked) {
      return res.status(403).json({
        success: false,
        message: 'This record has already been locked by the department administrator.'
      });
    }

    if (rows[0].status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Your profile has already been verified by the department administrator and cannot be resubmitted.'
      });
    }

    // Verify mandatory profile fields before submission
    const [students] = await pool.query(
      `SELECT year, section, gender, community, religion, mobile, email, aadhaar_no,
              permanent_address, district, state, pincode, father_name, annual_income, photo_path
       FROM students WHERE id = ?`,
      [studentId]
    );

    if (students.length > 0) {
      const s = students[0];
      const missing = [];
      if (!s.year) missing.push('Year of Study');
      if (!s.section) missing.push('Section');
      if (!s.gender) missing.push('Gender');
      if (!s.community) missing.push('Community');
      if (!s.religion) missing.push('Religion');
      if (!s.mobile) missing.push('Mobile Number');
      if (!s.email) missing.push('Email');
      if (!s.aadhaar_no) missing.push('Aadhaar Number');
      if (!s.permanent_address) missing.push('Permanent Address');
      if (!s.district) missing.push('District');
      if (!s.pincode) missing.push('Pincode');
      if (!s.father_name) missing.push('Father Name');
      if (s.annual_income === null || s.annual_income === undefined) missing.push('Annual Income');
      if (!s.photo_path) missing.push('Passport Photo');

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot submit profile: mandatory information is missing (${missing.join(', ')}). Please complete all required sections.`
        });
      }
    }

    await pool.query(
      `UPDATE students SET 
         status = 'SUBMITTED', 
         declaration_accepted = 1, 
         submission_date = NOW(),
         is_locked = 1,
         locked_at = NOW(),
         locked_by = 'SYSTEM (auto-lock on submit)'
       WHERE id = ?`,
      [studentId]
    );

    return res.json({
      success: true,
      message: 'Your student information has been submitted successfully and locked for verification.'
    });
  } catch (error) {
    console.error('[submitStudentDetails Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit details.' });
  }
};

/**
 * Upload Document (Photo, Aadhaar, Certs, etc.)
 */
const uploadDocument = async (req, res) => {
  try {
    const studentId = req.params.id ? parseInt(req.params.id, 10) : req.user.id;

    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      discardUpload(req.file);
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check lock
    const [existing] = await pool.query(
      'SELECT is_locked FROM students WHERE id = ?',
      [studentId]
    );

    if (existing.length === 0) {
      discardUpload(req.file);
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (existing[0].is_locked && req.user.role !== 'ADMIN') {
      discardUpload(req.file);
      return res.status(403).json({
        success: false,
        message: 'Record is locked. Cannot upload new documents.'
      });
    }

    if (req.fileValidationError) {
      discardUpload(req.file);
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded or file type is not supported. Please select a JPG, PNG, or PDF file.'
      });
    }

    // Enforce 2MB maximum limit
    if (req.file.size > 2 * 1024 * 1024) {
      discardUpload(req.file);
      return res.status(400).json({
        success: false,
        message: `File size (${(req.file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB limit. Please upload a smaller file.`
      });
    }

    const docType = req.body.docType || 'other';
    if (!ALLOWED_DOC_TYPES.includes(docType)) {
      discardUpload(req.file);
      return res.status(400).json({
        success: false,
        message: `Invalid document type "${docType}". Allowed types: ${ALLOWED_DOC_TYPES.join(', ')}`
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    // Read file buffer for permanent storage in TiDB / database
    let fileBuffer = null;
    if (req.file.path && fs.existsSync(req.file.path)) {
      try {
        fileBuffer = fs.readFileSync(req.file.path);
      } catch (readErr) {
        console.warn('[uploadDocument] Could not read file buffer:', readErr.message);
      }
    }

    // If uploading photo, update photo_path in students table
    if (docType === 'photo') {
      await pool.query(
        'UPDATE students SET photo_path = ? WHERE id = ?',
        [filePath, studentId]
      );
    }

    // Check if docType already exists for this student, if so replace or update
    const [existingDoc] = await pool.query(
      'SELECT id, file_path FROM student_documents WHERE student_id = ? AND doc_type = ?',
      [studentId, docType]
    );

    if (existingDoc.length > 0) {
      // Delete old file from disk
      const oldDiskPath = path.join(__dirname, '..', existingDoc[0].file_path);
      if (fs.existsSync(oldDiskPath)) {
        try { fs.unlinkSync(oldDiskPath); } catch (e) { /* ignore */ }
      }

      await pool.query(
        `UPDATE student_documents SET 
           file_name = ?, file_path = ?, file_size = ?, mime_type = ?, file_data = ?, uploaded_at = NOW() 
         WHERE id = ?`,
        [req.file.originalname, filePath, req.file.size, req.file.mimetype, fileBuffer, existingDoc[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO student_documents (student_id, doc_type, file_name, file_path, file_size, mime_type, file_data, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [studentId, docType, req.file.originalname, filePath, req.file.size, req.file.mimetype, fileBuffer]
      );
    }

    return res.json({
      success: true,
      message: `${docType.replace('_', ' ')} uploaded successfully.`,
      document: {
        docType,
        fileName: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    discardUpload(req.file);
    console.error('[uploadDocument Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
};

/**
 * Delete a specific document
 */
const deleteDocument = async (req, res) => {
  try {
    const studentId = req.params.id ? parseInt(req.params.id, 10) : req.user.id;
    const docId = parseInt(req.params.docId, 10);

    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const [existing] = await pool.query('SELECT is_locked FROM students WHERE id = ?', [studentId]);
    if (existing[0]?.is_locked && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Record is locked.' });
    }

    const [doc] = await pool.query(
      'SELECT id, doc_type, file_path FROM student_documents WHERE id = ? AND student_id = ?',
      [docId, studentId]
    );

    if (doc.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete file from disk
    const diskPath = path.join(__dirname, '..', doc[0].file_path);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) { /* ignore */ }
    }

    if (doc[0].doc_type === 'photo') {
      await pool.query('UPDATE students SET photo_path = NULL WHERE id = ?', [studentId]);
    }

    await pool.query('DELETE FROM student_documents WHERE id = ?', [docId]);

    return res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[deleteDocument Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentDetails,
  submitStudentDetails,
  uploadDocument,
  deleteDocument
};

