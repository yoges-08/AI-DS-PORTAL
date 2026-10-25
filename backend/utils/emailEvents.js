const { pool } = require('../config/db');
const { sendInBackground } = require('./mailer');
const { submitted, verified, rejected, locked, unlocked } = require('./emailTemplates');
const { generateStudentFormPdf } = require('./studentFormPdf');
const { readStoredFile } = require('./storedFiles');

const getMaxAttachmentBytes = () => parseInt(process.env.MAIL_MAX_ATTACHMENT_BYTES || '3000000', 10);

/**
 * Event E3: Student submitted profile dossier
 */
async function sendSubmissionEmail(studentId) {
  try {
    const [students] = await pool.query(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );
    if (!students || students.length === 0) return;
    const student = students[0];
    if (!student.email) return;

    // 1. Fetch photo if available
    let photoBuffer = null;
    if (student.photo_data) {
      photoBuffer = Buffer.isBuffer(student.photo_data) ? student.photo_data : Buffer.from(student.photo_data);
    } else if (student.photo_path) {
      photoBuffer = await readStoredFile({ filePath: student.photo_path });
    }

    // 2. Generate application summary PDF
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateStudentFormPdf(student, photoBuffer);
    } catch (pdfErr) {
      console.error(`[EmailEvents] Failed to generate PDF for student ${student.id}:`, pdfErr.message);
    }

    const attachments = [];
    let currentBytes = 0;
    const maxBytes = getMaxAttachmentBytes();
    const attachDocuments = process.env.MAIL_ATTACH_DOCUMENTS !== 'false';

    if (pdfBuffer) {
      currentBytes += pdfBuffer.length;
      attachments.push({
        name: `Application_${student.register_no}.pdf`,
        content: pdfBuffer.toString('base64')
      });
    }

    let omittedCount = 0;

    // 3. Attach uploaded documents if MAIL_ATTACH_DOCUMENTS is true (up to maxBytes total)
    if (attachDocuments) {
      const [docs] = await pool.query(
        'SELECT id, doc_type, file_name, file_path, mime_type, file_data, file_size FROM student_documents WHERE student_id = ?',
        [studentId]
      );

      for (const doc of docs) {
        if (doc.doc_type === 'photo') continue; // Photo is already inside the PDF
        try {
          const fileBuf = await readStoredFile({
            filePath: doc.file_path,
            fileName: doc.file_name,
            mimeType: doc.mime_type,
            fileData: doc.file_data
          });
          if (fileBuf) {
            if ((currentBytes + fileBuf.length) <= maxBytes) {
              currentBytes += fileBuf.length;
              attachments.push({
                name: doc.file_name || `${doc.doc_type}.pdf`,
                content: fileBuf.toString('base64')
              });
            } else {
              omittedCount++;
            }
          }
        } catch (docErr) {
          // Skip document if unreadable
        }
      }
    }

    const tpl = submitted({
      name: student.name,
      registerNo: student.register_no,
      submissionDate: student.submission_date,
      attachmentCount: attachments.length,
      omittedCount
    });

    sendInBackground({
      toEmail: student.email,
      toName: student.name,
      subject: tpl.subject,
      htmlContent: tpl.html,
      attachments,
      studentId: student.id,
      template: 'submitted'
    });
  } catch (err) {
    console.error(`[EmailEvents] Error triggering submission email for student ${studentId}:`, err.message);
  }
}

/**
 * Event E4 & E5: Profile verification status update
 */
async function sendStatusEmail(studentId, newStatus, reason = '') {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, register_no FROM students WHERE id = ?',
      [studentId]
    );
    if (!rows || rows.length === 0) return;
    const student = rows[0];
    if (!student.email) return;

    if (newStatus === 'VERIFIED') {
      const tpl = verified({ name: student.name, registerNo: student.register_no });
      sendInBackground({
        toEmail: student.email,
        toName: student.name,
        subject: tpl.subject,
        htmlContent: tpl.html,
        studentId: student.id,
        template: 'verified'
      });
    } else if (newStatus === 'REJECTED') {
      const tpl = rejected({ name: student.name, registerNo: student.register_no, reason });
      sendInBackground({
        toEmail: student.email,
        toName: student.name,
        subject: tpl.subject,
        htmlContent: tpl.html,
        studentId: student.id,
        template: 'rejected'
      });
    }
  } catch (err) {
    console.error(`[EmailEvents] Error triggering status email for student ${studentId}:`, err.message);
  }
}

/**
 * Event E6 & E7: Account locked or unlocked
 */
async function sendLockEmail(studentId, isLocked, reason = '') {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, register_no FROM students WHERE id = ?',
      [studentId]
    );
    if (!rows || rows.length === 0) return;
    const student = rows[0];
    if (!student.email) return;

    if (isLocked) {
      const tpl = locked({ name: student.name, registerNo: student.register_no, reason });
      sendInBackground({
        toEmail: student.email,
        toName: student.name,
        subject: tpl.subject,
        htmlContent: tpl.html,
        studentId: student.id,
        template: 'locked'
      });
    } else {
      const tpl = unlocked({ name: student.name, registerNo: student.register_no });
      sendInBackground({
        toEmail: student.email,
        toName: student.name,
        subject: tpl.subject,
        htmlContent: tpl.html,
        studentId: student.id,
        template: 'unlocked'
      });
    }
  } catch (err) {
    console.error(`[EmailEvents] Error triggering lock email for student ${studentId}:`, err.message);
  }
}

module.exports = {
  sendSubmissionEmail,
  sendStatusEmail,
  sendLockEmail
};
