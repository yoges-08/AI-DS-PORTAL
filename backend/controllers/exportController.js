const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const { maskAadhaar, maskBankAcc } = require('../utils/validators');
const { logAdminAction } = require('../utils/auditLogger');

/**
 * Export students data to Excel (.xlsx)
 */
const exportExcel = async (req, res) => {
  try {
    const { year, section, status } = req.query;

    const conditions = [];
    const params = [];

    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year, 10));
    }
    if (section) {
      conditions.push('section = ?');
      params.push(section.trim().toUpperCase());
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        register_no AS 'Register Number',
        name AS 'Student Name',
        dob AS 'Date of Birth',
        gender AS 'Gender',
        community AS 'Community',
        caste AS 'Caste',
        year AS 'Year',
        section AS 'Section',
        mobile AS 'Mobile Number',
        email AS 'Email Address',
        district AS 'District',
        state AS 'State',
        father_name AS 'Father Name',
        mother_name AS 'Mother Name',
        annual_income AS 'Annual Income (Rs)',
        sslc_percentage AS 'SSLC %',
        hsc_percentage AS 'HSC %',
        mode_of_admission AS 'Mode of Admission',
        CASE WHEN is_first_graduate = 1 THEN 'YES' ELSE 'NO' END AS 'First Graduate',
        CASE WHEN is_pms = 1 THEN 'YES' ELSE 'NO' END AS 'PMS Beneficiary',
        pms_application_no AS 'PMS Application No',
        pms_status AS 'PMS Status',
        bank_name AS 'Bank Name',
        bank_acc_no AS 'Bank Account No',
        bank_ifsc AS 'IFSC Code',
        status AS 'Status',
        CASE WHEN is_locked = 1 THEN 'LOCKED' ELSE 'UNLOCKED' END AS 'Lock Status',
        DATE_FORMAT(submission_date, '%d-%m-%Y %H:%i') AS 'Submitted At'
      FROM students
      ${whereClause}
      ORDER BY year ASC, section ASC, register_no ASC
    `;

    const [rows] = await pool.query(query, params);

    // Create workbook
    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'AI&DS Students');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'EXPORT_EXCEL',
      details: `Exported Excel sheet of ${rows.length} student records`,
      ipAddress: req.ip
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="AIDS_Department_Student_Records.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('[exportExcel Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate Excel export.' });
  }
};

/**
 * Export department student list to PDF report
 */
const exportPdf = async (req, res) => {
  try {
    const { year, section, status } = req.query;

    const conditions = [];
    const params = [];
    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year, 10));
    }
    if (section) {
      conditions.push('section = ?');
      params.push(section.trim().toUpperCase());
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status.trim().toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT register_no, name, dob, year, section, mobile, is_first_graduate, is_pms, status
      FROM students
      ${whereClause}
      ORDER BY year ASC, section ASC, register_no ASC
    `;

    const [students] = await pool.query(query, params);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);
      await logAdminAction({
        adminId: req.user.id,
        adminUsername: req.user.username,
        action: 'EXPORT_PDF',
        details: `Exported PDF report of ${students.length} student records`,
        ipAddress: req.ip
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="AIDS_Department_Student_Report.pdf"');
      res.send(pdfData);
    });

    // Header (Official Government / College style)
    doc.rect(30, 20, 782, 55).fill('#1F3A6E');
    doc.fillColor('#FFFFFF').fontSize(14).text('DEPARTMENT STUDENT INFORMATION SYSTEM', 40, 28, { align: 'center' });
    doc.fontSize(10).text('DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE', 40, 46, { align: 'center' });
    doc.fontSize(8).text(`OFFICIAL STUDENT MASTER REGISTER • Generated on ${new Date().toLocaleDateString('en-GB')}`, 40, 60, { align: 'center' });

    doc.moveDown(2);
    doc.fillColor('#333333').fontSize(9);

    // Table Header
    let y = 90;
    doc.rect(30, y, 782, 22).fill('#E2E8F0');
    doc.fillColor('#1F3A6E').fontSize(9).font('Helvetica-Bold');

    doc.text('S.No', 35, y + 6, { width: 30 });
    doc.text('Register No.', 70, y + 6, { width: 95 });
    doc.text('Student Name', 170, y + 6, { width: 170 });
    doc.text('DOB', 345, y + 6, { width: 75 });
    doc.text('Year/Sec', 425, y + 6, { width: 60 });
    doc.text('Mobile', 490, y + 6, { width: 90 });
    doc.text('First Grad', 585, y + 6, { width: 65 });
    doc.text('PMS', 655, y + 6, { width: 50 });
    doc.text('Status', 710, y + 6, { width: 95 });

    y += 24;
    doc.font('Helvetica').fontSize(8).fillColor('#222222');

    students.forEach((s, idx) => {
      // Check page break
      if (y > 540) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        y = 30;
        doc.rect(30, y, 782, 22).fill('#E2E8F0');
        doc.fillColor('#1F3A6E').fontSize(9).font('Helvetica-Bold');
        doc.text('S.No', 35, y + 6, { width: 30 });
        doc.text('Register No.', 70, y + 6, { width: 95 });
        doc.text('Student Name', 170, y + 6, { width: 170 });
        doc.text('DOB', 345, y + 6, { width: 75 });
        doc.text('Year/Sec', 425, y + 6, { width: 60 });
        doc.text('Mobile', 490, y + 6, { width: 90 });
        doc.text('First Grad', 585, y + 6, { width: 65 });
        doc.text('PMS', 655, y + 6, { width: 50 });
        doc.text('Status', 710, y + 6, { width: 95 });
        y += 24;
        doc.font('Helvetica').fontSize(8).fillColor('#222222');
      }

      // Alternate row shading
      if (idx % 2 === 1) {
        doc.rect(30, y - 2, 782, 18).fill('#F8FAFC');
        doc.fillColor('#222222');
      }

      doc.text(String(idx + 1), 35, y + 2, { width: 30 });
      doc.text(s.register_no || '-', 70, y + 2, { width: 95 });
      doc.text(s.name || '-', 170, y + 2, { width: 170 });
      doc.text(s.dob || '-', 345, y + 2, { width: 75 });
      doc.text(`${s.year} - ${s.section}`, 425, y + 2, { width: 60 });
      doc.text(s.mobile || 'Not Updated', 490, y + 2, { width: 90 });
      doc.text(s.is_first_graduate ? 'Yes' : 'No', 585, y + 2, { width: 65 });
      doc.text(s.is_pms ? 'Yes' : 'No', 655, y + 2, { width: 50 });
      doc.text(s.status || 'DRAFT', 710, y + 2, { width: 95 });

      // Bottom line
      doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(30, y + 17).lineTo(812, y + 17).stroke();

      y += 19;
    });

    // Signature line at bottom
    if (y > 480) {
      doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
      y = 50;
    }
    y += 40;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1F3A6E');
    doc.text('Prepared by: Verification In-Charge', 50, y);
    doc.text('Head of the Department (AI & DS)', 580, y);

    doc.end();
  } catch (error) {
    console.error('[exportPdf Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF export.' });
  }
};

module.exports = {
  exportExcel,
  exportPdf
};
