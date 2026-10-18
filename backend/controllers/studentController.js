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
    if (d.bankIfsc && !validateIfsc(d.bankIfsc)) {
      errors.bankIfsc = 'Invalid IFSC code format (e.g., SBIN0001234).';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for some fields.',
        errors
      });
    }

    // Prepare update query
    const updateQuery = `
      UPDATE students SET
        gender = COALESCE(?, gender),
        blood_group = COALESCE(?, blood_group),
        religion = COALESCE(?, religion),
        community = COALESCE(?, community),
        caste = COALESCE(?, caste),
        nationality = COALESCE(?, nationality),
        aadhaar_no = COALESCE(?, aadhaar_no),
        mother_tongue = COALESCE(?, mother_tongue),

        mobile = COALESCE(?, mobile),
        alt_mobile = COALESCE(?, alt_mobile),
        email = COALESCE(?, email),
        permanent_address = COALESCE(?, permanent_address),
        communication_address = COALESCE(?, communication_address),
        is_same_address = COALESCE(?, is_same_address),
        district = COALESCE(?, district),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),

        father_name = COALESCE(?, father_name),
        mother_name = COALESCE(?, mother_name),
        guardian_name = COALESCE(?, guardian_name),
        parents_occupation = COALESCE(?, parents_occupation),
        parents_mobile = COALESCE(?, parents_mobile),
        annual_income = COALESCE(?, annual_income),

        sslc_school = COALESCE(?, sslc_school),
        sslc_board = COALESCE(?, sslc_board),
        sslc_year = COALESCE(?, sslc_year),
        sslc_percentage = COALESCE(?, sslc_percentage),
        hsc_school = COALESCE(?, hsc_school),
        hsc_board = COALESCE(?, hsc_board),
        hsc_year = COALESCE(?, hsc_year),
        hsc_percentage = COALESCE(?, hsc_percentage),
        current_semester = COALESCE(?, current_semester),
        mode_of_admission = COALESCE(?, mode_of_admission),

        is_first_graduate = COALESCE(?, is_first_graduate),
        is_pms = COALESCE(?, is_pms),
        pms_application_no = COALESCE(?, pms_application_no),
        pms_status = COALESCE(?, pms_status),
        other_scholarship_name = COALESCE(?, other_scholarship_name),
        other_scholarship_amount = COALESCE(?, other_scholarship_amount),
        other_scholarship_status = COALESCE(?, other_scholarship_status),
        community_cert_no = COALESCE(?, community_cert_no),
        community_cert_issuer = COALESCE(?, community_cert_issuer),
        community_cert_date = COALESCE(?, community_cert_date),
        income_cert_no = COALESCE(?, income_cert_no),
        income_cert_issuer = COALESCE(?, income_cert_issuer),
        income_cert_date = COALESCE(?, income_cert_date),

        bank_acc_holder = COALESCE(?, bank_acc_holder),
        bank_name = COALESCE(?, bank_name),
        bank_acc_no = COALESCE(?, bank_acc_no),
        bank_ifsc = COALESCE(?, bank_ifsc),
        bank_branch = COALESCE(?, bank_branch)
      WHERE id = ?
    `;

    const commAddr = d.isSameAddress ? d.permanentAddress : d.communicationAddress;

    const values = [
      d.gender !== undefined ? d.gender : null,
      d.bloodGroup !== undefined ? d.bloodGroup : null,
      d.religion !== undefined ? d.religion : null,
      d.community !== undefined ? d.community : null,
      d.caste !== undefined ? d.caste : null,
      d.nationality !== undefined ? d.nationality : null,
      d.aadhaarNo !== undefined ? d.aadhaarNo : null,
      d.motherTongue !== undefined ? d.motherTongue : null,

      d.mobile !== undefined ? d.mobile : null,
      d.altMobile !== undefined ? d.altMobile : null,
      d.email !== undefined ? d.email : null,
      d.permanentAddress !== undefined ? d.permanentAddress : null,
      commAddr !== undefined ? commAddr : null,
      d.isSameAddress !== undefined ? (d.isSameAddress ? 1 : 0) : null,
      d.district !== undefined ? d.district : null,
      d.state !== undefined ? d.state : null,
      d.pincode !== undefined ? d.pincode : null,

      d.fatherName !== undefined ? d.fatherName : null,
      d.motherName !== undefined ? d.motherName : null,
      d.guardianName !== undefined ? d.guardianName : null,
      d.parentsOccupation !== undefined ? d.parentsOccupation : null,
      d.parentsMobile !== undefined ? d.parentsMobile : null,
      d.annualIncome !== undefined ? (d.annualIncome ? parseFloat(d.annualIncome) : null) : null,

      d.sslcSchool !== undefined ? d.sslcSchool : null,
      d.sslcBoard !== undefined ? d.sslcBoard : null,
      d.sslcYear !== undefined ? (d.sslcYear ? parseInt(d.sslcYear, 10) : null) : null,
      d.sslcPercentage !== undefined ? (d.sslcPercentage ? parseFloat(d.sslcPercentage) : null) : null,
      d.hscSchool !== undefined ? d.hscSchool : null,
      d.hscBoard !== undefined ? d.hscBoard : null,
      d.hscYear !== undefined ? (d.hscYear ? parseInt(d.hscYear, 10) : null) : null,
      d.hscPercentage !== undefined ? (d.hscPercentage ? parseFloat(d.hscPercentage) : null) : null,
      d.currentSemester !== undefined ? (d.currentSemester ? parseInt(d.currentSemester, 10) : null) : null,
      d.modeOfAdmission !== undefined ? d.modeOfAdmission : null,

      d.isFirstGraduate !== undefined ? (d.isFirstGraduate ? 1 : 0) : null,
      d.isPms !== undefined ? (d.isPms ? 1 : 0) : null,
      d.pmsApplicationNo !== undefined ? d.pmsApplicationNo : null,
      d.pmsStatus !== undefined ? d.pmsStatus : null,
      d.otherScholarshipName !== undefined ? d.otherScholarshipName : null,
      d.otherScholarshipAmount !== undefined ? (d.otherScholarshipAmount ? parseFloat(d.otherScholarshipAmount) : null) : null,
      d.otherScholarshipStatus !== undefined ? d.otherScholarshipStatus : null,
      d.communityCertNo !== undefined ? d.communityCertNo : null,
      d.communityCertIssuer !== undefined ? d.communityCertIssuer : null,
      d.communityCertDate !== undefined ? (d.communityCertDate || null) : null,
      d.incomeCertNo !== undefined ? d.incomeCertNo : null,
      d.incomeCertIssuer !== undefined ? d.incomeCertIssuer : null,
      d.incomeCertDate !== undefined ? (d.incomeCertDate || null) : null,

      d.bankAccHolder !== undefined ? d.bankAccHolder : null,
      d.bankName !== undefined ? d.bankName : null,
      d.bankAccNo !== undefined ? d.bankAccNo : null,
      d.bankIfsc !== undefined ? (d.bankIfsc ? d.bankIfsc.toUpperCase() : null) : null,
      d.bankBranch !== undefined ? d.bankBranch : null,

      studentId
    ];

    await pool.query(updateQuery, values);

    return res.json({
      success: true,
      message: 'Student details saved successfully.'
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

    // Verify student is not locked
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

    await pool.query(
      `UPDATE students SET 
         status = 'SUBMITTED', 
         declaration_accepted = 1, 
         submission_date = NOW() 
       WHERE id = ?`,
      [studentId]
    );

    return res.json({
      success: true,
      message: 'Your student information has been submitted successfully for verification.'
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
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check lock
    const [existing] = await pool.query(
      'SELECT is_locked FROM students WHERE id = ?',
      [studentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (existing[0].is_locked && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Record is locked. Cannot upload new documents.'
      });
    }

    if (req.fileValidationError) {
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
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      return res.status(400).json({
        success: false,
        message: `File size (${(req.file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2 MB limit. Please upload a smaller file.`
      });
    }

    const docType = req.body.docType || 'other';
    const filePath = `/uploads/${req.file.filename}`;

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
           file_name = ?, file_path = ?, file_size = ?, mime_type = ?, uploaded_at = NOW() 
         WHERE id = ?`,
        [req.file.originalname, filePath, req.file.size, req.file.mimetype, existingDoc[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO student_documents (student_id, doc_type, file_name, file_path, file_size, mime_type, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [studentId, docType, req.file.originalname, filePath, req.file.size, req.file.mimetype]
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
