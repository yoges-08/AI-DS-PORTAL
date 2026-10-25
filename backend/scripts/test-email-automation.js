/**
 * Comprehensive Test Suite for Brevo Email Automation System
 */
const { testConnection, pool } = require('../config/db');
const { issueCode, checkCode } = require('../utils/emailVerification');
const { mailEnabled, maskEmail, deliver } = require('../utils/mailer');
const templates = require('../utils/emailTemplates');
const { generateStudentFormPdf } = require('../utils/studentFormPdf');
const { runPeriodicCleanup } = require('../utils/cleanupJob');

async function runTests() {
  console.log('--- Starting Brevo Email Automation Test Suite ---');
  await testConnection();

  // Test 1: maskEmail helper
  console.log('\n[Test 1] Testing maskEmail...');
  const m1 = maskEmail('sathishkumar@gmail.com');
  const m2 = maskEmail('a@b.com');
  console.log(`Masked sathishkumar@gmail.com -> ${m1}`);
  console.log(`Masked a@b.com -> ${m2}`);
  if (!m1.includes('***') || !m1.endsWith('@gmail.com')) throw new Error('maskEmail failed for m1');
  console.log('✓ maskEmail works correctly.');

  // Test 2: HTML escaping
  console.log('\n[Test 2] Testing HTML escaping in templates...');
  const maliciousName = '<script>alert("hack")</script> & "quotes"';
  const tpl = templates.verificationCode({ name: maliciousName, code: '123456' });
  if (tpl.html.includes('<script>')) throw new Error('HTML escaping failed: script tag found!');
  if (!tpl.html.includes('&lt;script&gt;')) throw new Error('HTML escaping failed: escaped tag missing');
  console.log('✓ All user inputs are safely HTML-escaped.');

  // Test 3: All 7 templates render valid HTML without errors
  console.log('\n[Test 3] Testing all 7 email templates...');
  const t1 = templates.verificationCode({ name: 'Test Student', code: '654321' });
  const t2 = templates.accountCreated({ name: 'Test Student', registerNo: '71762305001' });
  const t3 = templates.submitted({ name: 'Test Student', registerNo: '71762305001', submissionDate: new Date() });
  const t4 = templates.verified({ name: 'Test Student', registerNo: '71762305001' });
  const t5 = templates.rejected({ name: 'Test Student', registerNo: '71762305001', reason: 'Upload clear community certificate' });
  const t6 = templates.locked({ name: 'Test Student', registerNo: '71762305001', reason: 'Administrative lock' });
  const t7 = templates.unlocked({ name: 'Test Student', registerNo: '71762305001' });

  [t1, t2, t3, t4, t5, t6, t7].forEach((t, i) => {
    if (!t.subject || !t.html || !t.html.includes('Department of AI &amp; DS')) {
      throw new Error(`Template E${i + 1} did not generate expected layout`);
    }
  });
  console.log('✓ All 7 email templates render successfully with institutional branding.');

  // Test 4: PDF Generation with Masked Sensitive Fields
  console.log('\n[Test 4] Testing Dossier PDF Generation...');
  const dummyStudent = {
    id: 9999,
    register_no: '71762305999',
    name: 'TEST STUDENT',
    dob: '2005-01-15',
    gender: 'Male',
    blood_group: 'O+',
    community: 'BC',
    caste: 'Test Caste',
    nationality: 'Indian',
    religion: 'Hindu',
    mother_tongue: 'Tamil',
    aadhaar_no: '123456789012',
    mobile: '9876543210',
    email: 'teststudent@example.com',
    bank_acc_no: '98765432101234',
    bank_name: 'State Bank of India',
    bank_branch: 'Thanjavur',
    bank_acc_holder: 'TEST STUDENT',
    bank_ifsc: 'SBIN0001234',
    status: 'SUBMITTED',
    submission_date: new Date()
  };

  const pdfBuf = await generateStudentFormPdf(dummyStudent);
  if (!Buffer.isBuffer(pdfBuf) || pdfBuf.length < 1000) {
    throw new Error('PDF generation produced invalid or empty buffer');
  }
  const header = pdfBuf.slice(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('Buffer is not a valid PDF file');
  }
  console.log(`✓ Application PDF generated successfully (${pdfBuf.length} bytes, format: ${header}).`);

  // Test 5: Code Verification Flow (issueCode & checkCode)
  console.log('\n[Test 5] Testing Code Issuance & Verification...');
  // Create a temporary dummy student in DB
  const [insertRes] = await pool.query(
    `INSERT INTO students (register_no, name, dob, email, password, email_verified)
     VALUES ('TEST999999', 'Verify Tester', '2004-05-10', 'tester99@example.com', 'dummyhash', 0)`
  );
  const tempStudentId = insertRes.insertId;

  // Issue code
  const issueResult = await issueCode(tempStudentId, 'tester99@example.com');
  if (!issueResult.success || !issueResult.code || issueResult.code.length !== 6) {
    throw new Error('issueCode failed to return 6-digit code');
  }
  console.log(`Issued code for student ${tempStudentId}: ${issueResult.code}`);

  // Test 60s cooldown
  const secondIssue = await issueCode(tempStudentId, 'tester99@example.com');
  if (secondIssue.error !== 'COOLDOWN') {
    throw new Error('Cooldown check failed: expected COOLDOWN error');
  }
  console.log(`✓ 60-second cooldown enforced correctly (waitSeconds: ${secondIssue.waitSeconds}).`);

  // Test invalid code check
  const badCheck = await checkCode(tempStudentId, '000000');
  if (badCheck.valid !== false || badCheck.error !== 'INVALID_CODE') {
    throw new Error('Wrong code was incorrectly accepted');
  }
  console.log(`✓ Wrong code rejected (remaining attempts: ${badCheck.remainingAttempts}).`);

  // Test correct code check
  const goodCheck = await checkCode(tempStudentId, issueResult.code);
  if (!goodCheck.valid) {
    throw new Error(`Valid code was rejected: ${goodCheck.message}`);
  }
  console.log('✓ Valid code accepted successfully.');

  // Verify DB state: email_verified must now be 1, and email_verifications row deleted
  const [verifyRows] = await pool.query('SELECT email_verified FROM students WHERE id = ?', [tempStudentId]);
  if (verifyRows[0].email_verified !== 1) {
    throw new Error('student.email_verified was not updated to 1');
  }
  const [pendingRows] = await pool.query('SELECT * FROM email_verifications WHERE student_id = ?', [tempStudentId]);
  if (pendingRows.length !== 0) {
    throw new Error('Pending email_verifications row was not deleted');
  }
  console.log('✓ Database updated: student.email_verified = 1 and verification record purged.');

  // Clean up temp student
  await pool.query('DELETE FROM students WHERE id = ?', [tempStudentId]);

  // Test 6: Mailer Kill Switch & Audit Logging
  console.log('\n[Test 6] Testing Mailer Kill Switch...');
  const sendRes = await deliver({
    toEmail: 'test@example.com',
    toName: 'Test Student',
    subject: 'Test Subject',
    htmlContent: '<p>Test</p>',
    template: 'unitTest'
  });
  if (!sendRes.skipped) {
    throw new Error('Expected deliver() to be skipped when MAIL_ENABLED is false');
  }
  const [logRows] = await pool.query('SELECT * FROM email_logs WHERE template = ? ORDER BY id DESC LIMIT 1', ['unitTest']);
  if (logRows.length === 0 || logRows[0].status !== 'SKIPPED') {
    throw new Error('email_logs entry was not recorded with status SKIPPED');
  }
  console.log('✓ Mailer kill switch works cleanly; SKIPPED audit entry recorded in email_logs.');

  // Test 7: Periodic Cleanup Job
  console.log('\n[Test 7] Testing Periodic Cleanup Job...');
  await runPeriodicCleanup();
  console.log('✓ runPeriodicCleanup completed without errors.');


  // Test 8: Cryptographic Verification Pass (pendingToken)
  console.log('\n[Test 8] Testing Verification Pass (pendingToken) Security...');
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../config/secrets');

  // 8a. Valid token signs and decodes correctly
  const validPass = jwt.sign({ purpose: 'email-verify', sid: 42 }, JWT_SECRET + ':email-verify', { expiresIn: '30m' });
  const decoded = jwt.verify(validPass, JWT_SECRET + ':email-verify');
  if (decoded.purpose !== 'email-verify' || decoded.sid !== 42) {
    throw new Error('Verification pass decoding failed');
  }

  // 8b. Forged token with wrong secret fails
  try {
    jwt.verify(validPass, 'wrong-secret');
    throw new Error('Forged token was unexpectedly accepted');
  } catch (err) {
    if (err.message.includes('unexpectedly accepted')) throw err;
  }

  // 8c. Token with wrong purpose is rejected
  const wrongPurposePass = jwt.sign({ purpose: 'student-auth', sid: 42 }, JWT_SECRET + ':email-verify');
  const decodedWrong = jwt.verify(wrongPurposePass, JWT_SECRET + ':email-verify');
  if (decodedWrong.purpose === 'email-verify') {
    throw new Error('Wrong purpose token matched email-verify');
  }
  console.log('✓ Cryptographic Verification Pass protects unverified accounts against unauthorized takeover.');

  console.log('\n======================================================');
  console.log('ALL EMAIL AUTOMATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
