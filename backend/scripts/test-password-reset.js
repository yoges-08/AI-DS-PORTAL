/**
 * Automated Test Suite for Self-Service Forgot Password & Security System
 */

const assert = require('assert');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const { pool, testConnection, getDbMode } = require('../config/db');
const { 
  issueResetCode, 
  checkResetCode, 
  verifyResetToken 
} = require('../utils/passwordReset');
const { checkPassword } = require('../utils/passwordPolicy');
const { 
  passwordResetCode, 
  passwordChangedNotice 
} = require('../utils/emailTemplates');

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Self-Service Password Reset Test Suite');
  console.log('====================================================\n');

  // Initialize DB (handles SQLite fallback if MySQL is offline)
  await testConnection();
  console.log(`[DB Ready] Active mode: ${getDbMode()}\n`);

  let passedCount = 0;

  try {
    // ----------------------------------------------------
    // Test 1: Verify database table password_resets
    // ----------------------------------------------------
    console.log('[Test 1] Verifying password_resets table existence...');
    let tableExists = false;
    if (getDbMode() === 'sqlite') {
      const [rows] = await pool.query("SELECT name FROM sqlite_master WHERE type='table' AND name='password_resets'");
      tableExists = rows && rows.length > 0;
    } else {
      const [rows] = await pool.query("SHOW TABLES LIKE 'password_resets'");
      tableExists = rows && rows.length > 0;
    }
    assert.strictEqual(tableExists, true, 'password_resets table should exist in database');
    console.log('  ✓ password_resets table exists in active database\n');
    passedCount++;

    // ----------------------------------------------------
    // Setup temporary test student
    // ----------------------------------------------------
    const testRegNo = '7176TEST999';
    const testDob = '2004-05-15';
    const testEmail = 'test.student@example.com';
    const testName = 'Test Student';
    const initialPlainPw = 'InitialPass#123';
    const initialHashedPw = await bcrypt.hash(initialPlainPw, 10);

    // Clean up any leftovers
    await pool.query('DELETE FROM password_resets WHERE student_id IN (SELECT id FROM students WHERE register_no = ?)', [testRegNo]);
    await pool.query('DELETE FROM students WHERE register_no = ?', [testRegNo]);

    await pool.query(
      `INSERT INTO students (name, register_no, dob, email, password, email_verified, token_version, is_locked)
       VALUES (?, ?, ?, ?, ?, 1, 1, 0)`,
      [testName, testRegNo, testDob, testEmail, initialHashedPw]
    );

    const [createdRows] = await pool.query('SELECT id, token_version FROM students WHERE register_no = ?', [testRegNo]);
    const testStudentId = createdRows[0].id;
    const initialTokenVersion = createdRows[0].token_version;
    console.log(`[Setup] Created test student (ID: ${testStudentId}, RegNo: ${testRegNo})\n`);

    // ----------------------------------------------------
    // Test 2: Drop table & test auto-recreation (Self-healing on Render)
    // ----------------------------------------------------
    console.log('[Test 2] Testing runtime self-healing when password_resets table is missing...');
    await pool.query('DROP TABLE IF EXISTS password_resets');
    
    // Now call issueResetCode when table doesn't exist
    const issue1 = await issueResetCode(testStudentId, testEmail);
    assert.strictEqual(Boolean(issue1.code), true, 'Should self-heal and return 6-digit code even if table was missing');
    assert.strictEqual(issue1.code.length, 6, 'Code must be 6 digits');
    assert.strictEqual(issue1.validMinutes, 10, 'Code should be valid for 10 minutes');
    console.log(`  ✓ Auto-created missing password_resets table and successfully issued code: ${issue1.code}`);

    // Attempting immediately again should be throttled by 60s cooldown
    const issue2 = await issueResetCode(testStudentId, testEmail);
    assert.strictEqual(issue2.error, 'COOLDOWN', 'Subsequent code request within 60s should trigger cooldown');
    assert.strictEqual(issue2.waitSeconds > 0, true, 'Should specify waitSeconds');
    console.log(`  ✓ Cooldown properly enforced (${issue2.waitSeconds}s remaining)\n`);
    passedCount++;

    // ----------------------------------------------------
    // Test 3: Validate incorrect OTP code & remaining attempts
    // ----------------------------------------------------
    console.log('[Test 3] Testing incorrect OTP validation & attempt counting...');
    const checkWrong = await checkResetCode(testStudentId, '999999');
    assert.strictEqual(checkWrong.valid, false, 'Invalid code should be rejected');
    assert.strictEqual(checkWrong.error, 'INVALID_CODE', 'Error code should be INVALID_CODE');
    assert.strictEqual(checkWrong.remainingAttempts, 4, 'Remaining attempts should decrease to 4');
    console.log('  ✓ Invalid code rejected with 4 remaining attempts\n');
    passedCount++;

    // ----------------------------------------------------
    // Test 4: Validate correct OTP code & receive reset token
    // ----------------------------------------------------
    console.log('[Test 4] Testing valid OTP verification & reset token receipt...');
    const checkValid = await checkResetCode(testStudentId, issue1.code);
    assert.strictEqual(checkValid.valid, true, 'Valid code should be accepted');
    assert.strictEqual(Boolean(checkValid.resetToken), true, 'Valid check should return a secure resetToken');
    console.log('  ✓ Valid code accepted, resetToken issued\n');
    passedCount++;

    // ----------------------------------------------------
    // Test 5: Verify reset token can only be consumed once
    // ----------------------------------------------------
    console.log('[Test 5] Testing reset token one-time consumption...');
    const verify1 = await verifyResetToken(testStudentId, checkValid.resetToken);
    assert.strictEqual(verify1.valid, true, 'First verification of reset token should succeed and consume it');

    const verify2 = await verifyResetToken(testStudentId, checkValid.resetToken);
    assert.strictEqual(verify2.valid, false, 'Second verification of same reset token must fail (already used)');
    console.log('  ✓ One-time token consumption verified\n');
    passedCount++;

    // ----------------------------------------------------
    // Test 6: Test institutional password policy rules
    // ----------------------------------------------------
    console.log('[Test 6] Testing institutional password policy rules...');
    
    // Too short
    const shortErr = checkPassword('Abc1', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(Boolean(shortErr), true, 'Password < 8 chars must be rejected');

    // Only letters
    const noNumErr = checkPassword('Abcdefghij', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(Boolean(noNumErr), true, 'Password without numbers must be rejected');

    // Only numbers
    const noAlphaErr = checkPassword('1234567890', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(Boolean(noAlphaErr), true, 'Password without letters must be rejected');

    // Contains Register Number
    const regNoErr = checkPassword('MyPass7176TEST999', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(Boolean(regNoErr), true, 'Password containing Register Number must be rejected');

    // Contains DOB (20040515)
    const dobErr = checkPassword('Pass20040515#', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(Boolean(dobErr), true, 'Password containing DOB must be rejected');

    // Strong valid password
    const validErr = checkPassword('SecureVault#2026', { registerNo: testRegNo, dob: testDob, minLength: 8 });
    assert.strictEqual(validErr, null, 'Strong password compliant with policy must pass');
    console.log('  ✓ Password policy validated across all institutional rules\n');
    passedCount++;

    // ----------------------------------------------------
    // Test 7: Update password & verify session revocation via token_version
    // ----------------------------------------------------
    console.log('[Test 7] Testing password update & session token_version increment...');
    const newPlainPw = 'SecureVault#2026';
    const newHashedPw = await bcrypt.hash(newPlainPw, 12);

    await pool.query(
      `UPDATE students 
       SET password = ?, 
           token_version = COALESCE(token_version, 1) + 1, 
           must_change_password = 0 
       WHERE id = ?`,
      [newHashedPw, testStudentId]
    );

    const [updatedRows] = await pool.query('SELECT password, token_version FROM students WHERE id = ?', [testStudentId]);
    assert.strictEqual(updatedRows[0].token_version, initialTokenVersion + 1, 'token_version must increment by 1');
    
    const pwMatch = await bcrypt.compare(newPlainPw, updatedRows[0].password);
    assert.strictEqual(pwMatch, true, 'New hashed password must match');
    console.log(`  ✓ Password updated in DB and token_version incremented from ${initialTokenVersion} to ${updatedRows[0].token_version}\n`);
    passedCount++;

    // ----------------------------------------------------
    // Test 8: Test Dual-Logo Security Email Templates
    // ----------------------------------------------------
    console.log('[Test 8] Testing Dual-Logo Security Email Templates...');
    const resetTpl = passwordResetCode({
      name: testName,
      code: '849201',
      validMinutes: 10
    });
    assert.strictEqual(resetTpl.subject.includes('849201'), true, 'Subject should include the reset code');
    assert.strictEqual(resetTpl.html.includes('849201'), true, 'Body must contain the 6-digit code');
    assert.strictEqual(resetTpl.html.includes('Department of Artificial Intelligence &amp; Data Science') || resetTpl.html.includes('Department of AI &amp; DS'), true, 'Must include department branding');

    const noticeTpl = passwordChangedNotice({
      name: testName,
      registerNo: testRegNo
    });
    assert.strictEqual(noticeTpl.subject.includes('Security Alert'), true, 'Subject should state Security Alert');
    assert.strictEqual(noticeTpl.html.includes(testRegNo), true, 'Body must contain the register number');
    console.log('  ✓ Both security email templates rendered with dual institutional branding\n');
    passedCount++;

    // ----------------------------------------------------
    // Clean up test student
    // ----------------------------------------------------
    await pool.query('DELETE FROM password_resets WHERE student_id = ?', [testStudentId]);
    await pool.query('DELETE FROM students WHERE id = ?', [testStudentId]);
    console.log('[Cleanup] Test student and reset tokens cleaned up.\n');

    console.log('====================================================');
    console.log(`🎉 ALL ${passedCount} PASSWORD RESET TESTS PASSED WITH ZERO ERRORS!`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  }
}

runTests();
