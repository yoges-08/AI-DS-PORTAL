process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
const { pool, testConnection } = require('../config/db');
const { clearFailures } = require('../utils/lockout');
const {
  verifyStudentEligibility,
  registerStudent,
  loginStudent
} = require('../controllers/authController');
const {
  bulkImportStudents,
  previewBulkImport,
  resetStudentPassword
} = require('../controllers/adminController');
const path = require('path');
const fs = require('fs');

// Mock req and res helper
const mockReqRes = (body = {}, params = {}, user = { id: 1, username: 'admin' }, file = null, ip = '127.0.0.1') => {
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie() {
      return this;
    }
  };
  const req = {
    body,
    params,
    user,
    file,
    ip
  };
  return { req, res, getStatus: () => statusCode, getData: () => responseData };
};

async function runTests() {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: test-student-onboarding.js cannot run in production.');
    process.exit(1);
  }
  console.log('--- Starting Student Onboarding Test Suite ---');
  await testConnection();

  const testRegNo = '71762305099';
  const testDob = '2004-05-15';
  const testEmail = 'teststudent99@testcollege.edu';
  const testPassword = 'Password#123';

  try {
    // 0. Clean up previous test data if any
    await pool.query('DELETE FROM student_whitelist WHERE register_no = ?', [testRegNo]);
    await pool.query('DELETE FROM students WHERE register_no = ?', [testRegNo]);

    // 1. Whitelist Import: Insert test student into whitelist (unclaimed)
    await pool.query(
      `INSERT INTO student_whitelist (register_no, dob, is_claimed)
       VALUES (?, ?, 0)`,
      [testRegNo, testDob]
    );
    console.log('✓ 1. Whitelist record inserted.');

    // 2. Live Verification Tests
    // 2a. Wrong DOB
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, dob: '2000-01-01' });
      await verifyStudentEligibility(req, res);
      if (getStatus() === 200 && getData().status === 'NO_MATCH') {
        console.log('✓ 2a. Wrong DOB returns NO_MATCH as expected.');
      } else {
        throw new Error(`2a failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 2b. Correct DOB -> MATCH
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, dob: testDob });
      await verifyStudentEligibility(req, res);
      if (getStatus() === 200 && getData().status === 'MATCH') {
        console.log('✓ 2b. Correct RegNo + DOB returns MATCH.');
      } else {
        throw new Error(`2b failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 3. Self-Registration
    {
      const { req, res, getStatus, getData } = mockReqRes({
        registerNo: testRegNo,
        dob: testDob,
        name: 'TEST STUDENT ONBOARDING',
        email: testEmail,
        password: testPassword
      });
      await registerStudent(req, res);
      if (getStatus() === 201 && getData().success && getData().user) {
        console.log('✓ 3. Self-registration succeeded, student account created.');
      } else {
        throw new Error(`3 failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 4. Whitelist is now marked claimed
    const [wlRows] = await pool.query('SELECT is_claimed, claimed_student_id FROM student_whitelist WHERE register_no = ?', [testRegNo]);
    if (wlRows.length > 0 && wlRows[0].is_claimed === 1) {
      console.log('✓ 4. Whitelist row is now marked claimed with claimed_student_id =', wlRows[0].claimed_student_id);
    } else {
      throw new Error('4 failed: Whitelist record was not marked claimed.');
    }

    // 5. Subsequent verification check returns ALREADY_REGISTERED
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, dob: testDob });
      await verifyStudentEligibility(req, res);
      if (getStatus() === 200 && getData().status === 'ALREADY_REGISTERED') {
        console.log('✓ 5. Re-verification returns ALREADY_REGISTERED.');
      } else {
        throw new Error(`5 failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 6. Student Login with chosen password
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, password: testPassword });
      await loginStudent(req, res);
      if (getStatus() === 200 && getData().success && getData().user) {
        console.log('✓ 6. Student login with chosen password succeeded.');
      } else {
        throw new Error(`6 failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 7. Old DOB password login must fail
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, password: '15052004' });
      await loginStudent(req, res);
      if (getStatus() === 401 && !getData().success) {
        console.log('✓ 7. Old DOB password rejected as expected.');
      } else {
        throw new Error(`7 failed: Old DOB was accepted! status ${getStatus()}`);
      }
    }

    // 8. Admin Reset Password generates temporary password
    let tempPass = null;
    {
      const studentId = wlRows[0].claimed_student_id;
      const { req, res, getStatus, getData } = mockReqRes({}, { id: studentId });
      await resetStudentPassword(req, res);
      if (getStatus() === 200 && getData().success && getData().tempPassword) {
        tempPass = getData().tempPassword;
        console.log('✓ 8. Admin reset generated tempPassword:', tempPass);
      } else {
        throw new Error(`8 failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 9. Login with temporary password succeeds and requires password change
    {
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: testRegNo, password: tempPass });
      await loginStudent(req, res);
      if (getStatus() === 200 && getData().success && getData().mustChangePassword === true) {
        console.log('✓ 9. Temp password login succeeded with mustChangePassword = true.');
      } else {
        throw new Error(`9 failed: status ${getStatus()}, data ${JSON.stringify(getData())}`);
      }
    }

    // 10. Test Preview & Bulk Import with 2-column CSV sample
    {
      const sampleCsvPath = fs.existsSync(path.join(__dirname, '..', '..', 'sample_student_bulk_import.csv'))
        ? path.join(__dirname, '..', '..', 'sample_student_bulk_import.csv')
        : path.join(__dirname, '..', '..', 'frontend', 'public', 'sample_student_bulk_import.csv');
      const sampleCsvCopy = path.join(__dirname, 'temp_sample_test.csv');
      fs.copyFileSync(sampleCsvPath, sampleCsvCopy);

      const fileObj = {
        path: sampleCsvCopy,
        originalname: 'sample_student_bulk_import.csv'
      };

      const { req: pReq, res: pRes, getStatus: pStatus, getData: pData } = mockReqRes({}, {}, { id: 1, username: 'admin' }, fileObj);
      await previewBulkImport(pReq, pRes);
      if (pStatus() === 200 && pData().success && pData().validCount === 5) {
        console.log('✓ 10a. Bulk import preview parsed 5 valid rows from 2-column CSV.');
      } else {
        throw new Error(`10a failed: status ${pStatus()}, data ${JSON.stringify(pData())}`);
      }

      // Re-copy for bulk import execution
      fs.copyFileSync(sampleCsvPath, sampleCsvCopy);
      const { req: iReq, res: iRes, getStatus: iStatus, getData: iData } = mockReqRes({}, {}, { id: 1, username: 'admin' }, fileObj);
      await bulkImportStudents(iReq, iRes);
      if (iStatus() === 200 && iData().success && iData().insertedCount + iData().updatedCount + iData().skippedCount === 5) {
        console.log('✓ 10b. Bulk import executed successfully. Inserted/Updated/Skipped:', iData().insertedCount, iData().updatedCount, iData().skippedCount);
      } else {
        throw new Error(`10b failed: status ${iStatus()}, data ${JSON.stringify(iData())}`);
      }

      if (fs.existsSync(sampleCsvCopy)) fs.unlinkSync(sampleCsvCopy);
    }

    // 11. Lockout verification: 5 consecutive NO_MATCH on a register number locks it for 15 minutes
    {
      const lockReg = '71762305088';
      await clearFailures('verify:' + lockReg);
      for (let i = 1; i <= 4; i++) {
        const { req, res, getStatus, getData } = mockReqRes({ registerNo: lockReg, dob: '2000-01-01' }, {}, {}, null, `127.0.0.${i}`);
        await verifyStudentEligibility(req, res);
        if (getStatus() !== 200 || getData().status !== 'NO_MATCH') {
          throw new Error(`11 iteration ${i} failed`);
        }
      }
      // 5th attempt triggers lockout and returns 429
      const { req, res, getStatus, getData } = mockReqRes({ registerNo: lockReg, dob: '2000-01-01' }, {}, {}, null, '127.0.0.99');
      await verifyStudentEligibility(req, res);
      if (getStatus() === 429 && getData().status === 'RATE_LIMITED') {
        console.log('✓ 11. Register number successfully locked out after 5 failures (HTTP 429 RATE_LIMITED).');
      } else {
        throw new Error(`11 failed: Expected 429, got ${getStatus()} ${JSON.stringify(getData())}`);
      }
    }

    // Cleanup test record
    await pool.query('DELETE FROM student_whitelist WHERE register_no = ?', [testRegNo]);
    await pool.query('DELETE FROM students WHERE register_no = ?', [testRegNo]);

    console.log('\n========================================');
    console.log('ALL 11 ONBOARDING TESTS PASSED PERFECTLY!');
    console.log('========================================\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
