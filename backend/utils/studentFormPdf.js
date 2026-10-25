const PDFDocument = require('pdfkit');
const { maskAadhaar, maskBankAcc } = require('./validators');
const { decrypt } = require('./fieldCrypto');
const { readStoredFile } = require('./storedFiles');

/**
 * Generate a PDF summary of the student's submitted profile dossier
 * @param {Object} student - Student record from DB
 * @param {Buffer|null} photoBuffer - Optional passport photo buffer
 * @returns {Promise<Buffer>} - Generated PDF buffer
 */
async function generateStudentFormPdf(student, photoBuffer = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Student_Dossier_${student.register_no || 'profile'}`,
          Author: 'Department of AI & DS, AAMEC',
          Subject: 'Student Information Dossier'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const primaryColor = '#1e293b'; // Slate 800
      const accentColor = '#4338ca';  // Indigo 700
      const lightBg = '#f8fafc';      // Slate 50
      const textMuted = '#64748b';    // Slate 500
      const textDark = '#0f172a';     // Slate 900
      const pageWidth = doc.page.width;
      const margin = 36;
      const contentWidth = pageWidth - (margin * 2);

      // --- 1. Institutional Header ---
      doc.rect(margin, margin, contentWidth, 54).fill(primaryColor);

      doc.fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ANJALAI AMMAL MAHALINGAM ENGINEERING COLLEGE', margin, margin + 8, {
          width: contentWidth,
          align: 'center'
        });

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE', margin, margin + 22, {
          width: contentWidth,
          align: 'center'
        });

      doc.fillColor('#cbd5e1')
        .fontSize(8)
        .font('Helvetica')
        .text('STUDENT PROFILE DOSSIER & VERIFICATION SUMMARY', margin, margin + 38, {
          width: contentWidth,
          align: 'center'
        });

      let yPos = margin + 62;

      // --- Student Photo (Top Right) ---
      const photoWidth = 72;
      const photoHeight = 90;
      const photoX = pageWidth - margin - photoWidth;
      const photoY = yPos;

      let hasPhoto = false;
      if (photoBuffer && Buffer.isBuffer(photoBuffer)) {
        try {
          doc.image(photoBuffer, photoX, photoY, {
            width: photoWidth,
            height: photoHeight,
            fit: [photoWidth, photoHeight]
          });
          doc.rect(photoX, photoY, photoWidth, photoHeight).lineWidth(1).strokeColor('#cbd5e1').stroke();
          hasPhoto = true;
        } catch (imgErr) {
          hasPhoto = false;
        }
      }

      if (!hasPhoto) {
        doc.rect(photoX, photoY, photoWidth, photoHeight).fillAndStroke(lightBg, '#cbd5e1');
        doc.fillColor(textMuted).fontSize(7).text('PHOTO\nNOT AVAILABLE', photoX, photoY + 36, {
          width: photoWidth,
          align: 'center'
        });
      }

      // --- Helper: Draw Section Header ---
      const drawSectionHeader = (title, topY) => {
        if (topY > 740) {
          doc.addPage();
          topY = margin + 10;
        }
        doc.rect(margin, topY, contentWidth, 18).fill('#e2e8f0');
        doc.fillColor(accentColor)
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(title.toUpperCase(), margin + 8, topY + 4);
        return topY + 22;
      };

      // --- Helper: Draw Grid Rows ---
      const drawGridRow = (cols, topY) => {
        if (topY > 770) {
          doc.addPage();
          topY = margin + 10;
        }
        const colWidth = contentWidth / cols.length;
        let maxHeight = 22;

        cols.forEach((col, idx) => {
          const x = margin + (idx * colWidth);
          doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(7)
            .text(col.label.toUpperCase(), x + 4, topY);
          
          doc.fillColor(textDark).font('Helvetica').fontSize(8.5)
            .text(String(col.value !== null && col.value !== undefined && col.value !== '' ? col.value : '-'), x + 4, topY + 9, {
              width: colWidth - 8,
              lineBreak: true
            });
        });

        return topY + maxHeight;
      };

      // 1. Personal Details
      yPos = drawSectionHeader('1. Personal Details', yPos);
      const personalWidth = contentWidth - photoWidth - 12;

      const drawPersonalCol = (label, val, x, y, width) => {
        doc.fillColor(textMuted).font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), x, y);
        doc.fillColor(textDark).font('Helvetica').fontSize(8.5).text(String(val || '-'), x, y + 9, { width });
      };

      // Aadhaar masking
      let rawAadhaar = student.aadhaar_no;
      if (rawAadhaar) {
        try { rawAadhaar = decrypt(rawAadhaar); } catch (e) {}
      }
      const maskedAadhaar = maskAadhaar(rawAadhaar);

      const pColW = personalWidth / 2;
      drawPersonalCol('Register Number', student.register_no, margin + 4, yPos, pColW - 8);
      drawPersonalCol('Full Name', student.name, margin + 4 + pColW, yPos, pColW - 8);
      yPos += 22;

      drawPersonalCol('Date of Birth', student.dob, margin + 4, yPos, pColW - 8);
      drawPersonalCol('Gender', student.gender, margin + 4 + pColW, yPos, pColW - 8);
      yPos += 22;

      drawPersonalCol('Blood Group', student.blood_group, margin + 4, yPos, pColW - 8);
      drawPersonalCol('Nationality', student.nationality || 'Indian', margin + 4 + pColW, yPos, pColW - 8);
      yPos += 22;

      drawPersonalCol('Community', student.community, margin + 4, yPos, pColW - 8);
      drawPersonalCol('Caste', student.caste, margin + 4 + pColW, yPos, pColW - 8);
      yPos += 22;

      drawPersonalCol('Religion', student.religion, margin + 4, yPos, pColW - 8);
      drawPersonalCol('Mother Tongue', student.mother_tongue, margin + 4 + pColW, yPos, pColW - 8);
      yPos += 22;

      drawPersonalCol('Aadhaar Number', maskedAadhaar, margin + 4, yPos, pColW - 8);
      yPos += 26;

      // 2. Contact Details
      yPos = drawSectionHeader('2. Contact Details', yPos);
      yPos = drawGridRow([
        { label: 'Mobile Number', value: student.mobile },
        { label: 'Alternate Mobile', value: student.alt_mobile },
        { label: 'Email Address', value: student.email }
      ], yPos);

      yPos = drawGridRow([
        { label: 'Permanent Address', value: student.permanent_address },
        { label: 'Communication Address', value: student.communication_address }
      ], yPos + 4);

      yPos = drawGridRow([
        { label: 'District', value: student.district },
        { label: 'State', value: student.state },
        { label: 'Pincode', value: student.pincode }
      ], yPos + 6);

      // 3. Family Details
      yPos = drawSectionHeader('3. Family Details', yPos + 4);
      yPos = drawGridRow([
        { label: 'Father Name', value: student.father_name },
        { label: 'Mother Name', value: student.mother_name },
        { label: 'Guardian Name', value: student.guardian_name }
      ], yPos);

      yPos = drawGridRow([
        { label: 'Parents Occupation', value: student.parents_occupation },
        { label: 'Parents Mobile', value: student.parents_mobile },
        { label: 'Annual Income', value: student.annual_income ? `Rs. ${Number(student.annual_income).toLocaleString('en-IN')}` : '-' }
      ], yPos + 4);

      // 4. Academic Details
      yPos = drawSectionHeader('4. Academic Details', yPos + 4);
      yPos = drawGridRow([
        { label: 'SSLC School', value: student.sslc_school },
        { label: 'SSLC Board', value: student.sslc_board },
        { label: 'SSLC Year / %', value: `${student.sslc_year || '-'} / ${student.sslc_percentage ? student.sslc_percentage + '%' : '-'}` }
      ], yPos);

      yPos = drawGridRow([
        { label: 'HSC School', value: student.hsc_school },
        { label: 'HSC Board', value: student.hsc_board },
        { label: 'HSC Year / %', value: `${student.hsc_year || '-'} / ${student.hsc_percentage ? student.hsc_percentage + '%' : '-'}` }
      ], yPos + 4);

      yPos = drawGridRow([
        { label: 'Year / Section', value: student.year && student.section ? `Year ${student.year} - Section ${student.section}` : '-' },
        { label: 'Current Semester', value: student.current_semester },
        { label: 'Mode of Admission', value: student.mode_of_admission }
      ], yPos + 4);

      let arrearSummary = 'None (All Clear)';
      if (student.has_arrears) {
        let details = student.arrear_details;
        if (typeof details === 'string') {
          try { details = JSON.parse(details); } catch (e) { details = []; }
        }
        if (Array.isArray(details) && details.length > 0) {
          arrearSummary = details.map(d => `${d.subjectCode || ''} (Sem ${d.semester || '?'})`).join(', ');
        } else {
          arrearSummary = 'Yes (Subjects Declared)';
        }
      }

      yPos = drawGridRow([
        { label: 'Standing Arrears', value: student.has_arrears ? 'YES' : 'NO (Clear)' },
        { label: 'Arrear Subject(s)', value: arrearSummary }
      ], yPos + 4);

      // 5. Scholarship & Category
      yPos = drawSectionHeader('5. Scholarship & Category Details', yPos + 4);
      yPos = drawGridRow([
        { label: 'First Graduate', value: student.is_first_graduate ? 'Yes' : 'No' },
        { label: 'Post Matric Scholarship (PMS)', value: student.is_pms ? `Yes (App: ${student.pms_application_no || 'N/A'})` : 'No' },
        { label: 'Other Scholarship', value: student.other_scholarship_name || 'None' }
      ], yPos);

      yPos = drawGridRow([
        { label: 'Community Cert No', value: student.community_cert_no },
        { label: 'Community Cert Issuer', value: student.community_cert_issuer },
        { label: 'Income Cert No', value: student.income_cert_no }
      ], yPos + 4);

      // 6. Bank Details (Aadhaar & Bank numbers MUST be masked)
      let rawBankAcc = student.bank_acc_no;
      if (rawBankAcc) {
        try { rawBankAcc = decrypt(rawBankAcc); } catch (e) {}
      }
      const maskedBank = maskBankAcc(rawBankAcc);

      yPos = drawSectionHeader('6. Bank Account Details', yPos + 4);
      yPos = drawGridRow([
        { label: 'Account Holder Name', value: student.bank_acc_holder },
        { label: 'Bank Name & Branch', value: `${student.bank_name || '-'} (${student.bank_branch || '-'})` },
        { label: 'Account No & IFSC', value: `${maskedBank} / ${student.bank_ifsc || '-'}` }
      ], yPos);

      // 7. Declaration & Submission Signoff
      yPos = drawSectionHeader('7. Student Declaration & Verification Status', yPos + 4);
      const subDate = student.submission_date ? new Date(student.submission_date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

      doc.rect(margin, yPos, contentWidth, 34).fill('#f8fafc');
      doc.fillColor(textDark).fontSize(7.5).font('Helvetica-Oblique')
        .text(
          'Declaration: I hereby declare that all the information furnished in this Student Dossier is true, complete, and correct to the best of my knowledge and belief.',
          margin + 6,
          yPos + 4,
          { width: contentWidth - 12 }
        );

      doc.fillColor(accentColor).fontSize(8).font('Helvetica-Bold')
        .text(`Status: ${student.status || 'SUBMITTED'}   |   Submission Date: ${subDate}`, margin + 6, yPos + 20);

      // Footer
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fillColor(textMuted).fontSize(7).font('Helvetica')
          .text(
            `AI & DS Student Portal - AAMEC  |  Page ${i + 1} of ${totalPages}  |  Official Department Record`,
            margin,
            doc.page.height - 24,
            { width: contentWidth, align: 'center' }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateStudentFormPdf
};
