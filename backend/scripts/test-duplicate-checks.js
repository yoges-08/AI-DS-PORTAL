const xlsx = require('xlsx');
const { pool, testConnection } = require('../config/db');
const { parseWhitelistSpreadsheet, bulkImportStudents, addStudent } = require('../controllers/adminController');
const fs = require('fs');
const path = require('path');

function createBufferFromRows(rows) {
  const ws = xlsx.utils.aoa_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function runDuplicateTests() {
  console.log('--- Starting Duplicate Data & Re-Entry Test Suite ---');
  await testConnection();

  try {
    // Clean up any test records
    await pool.query("DELETE FROM students WHERE register_no LIKE '7176210599%'");
    await pool.query("DELETE FROM student_whitelist WHERE register_no LIKE '7176210599%'");

    // TEST 1: Duplicate Register Number in spreadsheet
    console.log('\n[Test 1] Testing Duplicate Register Number in Spreadsheet...');
    const duplicateRegSheet = createBufferFromRows([
      ['Register No', 'DOB'],
      ['71762105991', '15-05-2004'],
      ['71762105991', '15-05-2004'] // Duplicate
    ]);
    const parsed1 = parseWhitelistSpreadsheet(duplicateRegSheet, 'test_dup_reg.xlsx');
    if (parsed1.validRows.length !== 1 || parsed1.errors.length !== 1) {
      throw new Error(`Expected 1 valid row and 1 error, got: ${parsed1.validRows.length} valid, ${parsed1.errors.length} errors`);
    }
    if (!parsed1.errors[0].error.includes('Duplicate Register Number')) {
      throw new Error(`Unexpected error message: ${parsed1.errors[0].error}`);
    }
    console.log(`✓ Duplicate Register Number detected and rejected: "${parsed1.errors[0].error}"`);

    // TEST 2: Duplicate Email inside the same spreadsheet
    console.log('\n[Test 2] Testing Duplicate Email in Spreadsheet...');
    const duplicateEmailSheet = createBufferFromRows([
      ['Register No', 'DOB', 'Email'],
      ['71762105992', '15-05-2004', 'shared_test@gmail.com'],
      ['71762105993', '20-06-2004', 'shared_test@gmail.com'] // Same email for different student
    ]);
    const parsed2 = parseWhitelistSpreadsheet(duplicateEmailSheet, 'test_dup_email.xlsx');
    if (parsed2.validRows.length !== 1 || parsed2.errors.length !== 1) {
      throw new Error(`Expected 1 valid row and 1 error, got: ${parsed2.validRows.length} valid, ${parsed2.errors.length} errors`);
    }
    if (!parsed2.errors[0].error.includes('Duplicate Email address')) {
      throw new Error(`Unexpected error message: ${parsed2.errors[0].error}`);
    }
    console.log(`✓ Duplicate Email within file detected and rejected: "${parsed2.errors[0].error}"`);

    // TEST 3: Attempting to import an email already claimed by an active student
    console.log('\n[Test 3] Testing Email Collision with Existing Registered Student...');
    const [insStudent] = await pool.query(
      `INSERT INTO students (register_no, name, dob, email, password, status)
       VALUES ('71762105994', 'Existing Student', '2004-05-15', 'registered_active@gmail.com', 'hash', 'DRAFT')`
    );

    const collisionSheetBuf = createBufferFromRows([
      ['Register No', 'DOB', 'Email'],
      ['71762105995', '10-08-2004', 'registered_active@gmail.com']
    ]);

    const tempFile = path.join(__dirname, 'temp_collision_test.xlsx');
    fs.writeFileSync(tempFile, collisionSheetBuf);

    const mockReq = {
      file: { path: tempFile, originalname: 'temp_collision_test.xlsx' },
      user: { id: 1, username: 'admin' },
      ip: '127.0.0.1'
    };
    let jsonResult = null;
    const mockRes = {
      status(code) { return this; },
      json(d) { jsonResult = d; return this; }
    };

    await bulkImportStudents(mockReq, mockRes);
    if (!jsonResult || !jsonResult.success) {
      throw new Error(`bulkImportStudents failed: ${JSON.stringify(jsonResult)}`);
    }
    if (jsonResult.insertedCount !== 0 || jsonResult.skippedCount !== 1) {
      throw new Error(`Expected 0 inserted, 1 skipped. Got: ${jsonResult.insertedCount} inserted, ${jsonResult.skippedCount} skipped`);
    }
    console.log(`✓ Collision detected and candidate skipped: "${jsonResult.errors[0]}"`);

    // TEST 4: SQLite Unique Email Constraint Verification
    console.log('\n[Test 4] Testing Database-Level Unique Email Constraint...');
    let thrownError = null;
    try {
      await pool.query(
        `INSERT INTO students (register_no, name, dob, email, password, status)
         VALUES ('71762105996', 'Dupe Email Student', '2004-05-15', 'registered_active@gmail.com', 'hash', 'DRAFT')`
      );
    } catch (err) {
      thrownError = err;
    }
    if (!thrownError || !/unique/i.test(thrownError.message)) {
      throw new Error(`Expected UNIQUE constraint violation on duplicate email, got: ${thrownError ? thrownError.message : 'No error'}`);
    }
    console.log(`✓ Database strictly rejected duplicate student email.`);

    // TEST 5: Manual Add Student duplicate detection
    console.log('\n[Test 5] Testing Manual addStudent Duplicate Register Number Check...');
    const mockAddReq1 = {
      body: { registerNo: '71762105997', dob: '2004-05-15' },
      user: { id: 1, username: 'admin' },
      ip: '127.0.0.1'
    };
    let addStatus1 = 200;
    let addJson1 = null;
    const mockAddRes1 = {
      status(code) { addStatus1 = code; return this; },
      json(d) { addJson1 = d; return this; }
    };

    // 1st add: should succeed
    await addStudent(mockAddReq1, mockAddRes1);
    if (!addJson1 || !addJson1.success) {
      throw new Error(`First addStudent failed: ${JSON.stringify(addJson1)}`);
    }
    console.log('✓ 5a. First addStudent succeeded.');

    // 2nd add with SAME Register No and SAME DOB: MUST FAIL with ALREADY_WHITELISTED
    let addStatus2 = 200;
    let addJson2 = null;
    const mockAddRes2 = {
      status(code) { addStatus2 = code; return this; },
      json(d) { addJson2 = d; return this; }
    };
    await addStudent(mockAddReq1, mockAddRes2);
    if (addStatus2 !== 409 || !addJson2 || addJson2.code !== 'ALREADY_WHITELISTED') {
      throw new Error(`Expected HTTP 409 ALREADY_WHITELISTED, got status ${addStatus2}: ${JSON.stringify(addJson2)}`);
    }
    console.log(`✓ 5b. Re-adding same Register No & DOB rejected with HTTP 409: "${addJson2.message}"`);

    // 3rd add with SAME Register No but DIFFERENT DOB: MUST FAIL with DOB_MISMATCH
    const mockAddReqDiffDob = {
      body: { registerNo: '71762105997', dob: '2004-09-20' },
      user: { id: 1, username: 'admin' },
      ip: '127.0.0.1'
    };
    let addStatus3 = 200;
    let addJson3 = null;
    const mockAddRes3 = {
      status(code) { addStatus3 = code; return this; },
      json(d) { addJson3 = d; return this; }
    };
    await addStudent(mockAddReqDiffDob, mockAddRes3);
    if (addStatus3 !== 409 || !addJson3 || addJson3.code !== 'DOB_MISMATCH') {
      throw new Error(`Expected HTTP 409 DOB_MISMATCH, got status ${addStatus3}: ${JSON.stringify(addJson3)}`);
    }
    console.log(`✓ 5c. Re-adding with different DOB rejected with HTTP 409: "${addJson3.message}"`);

    // Clean up
    await pool.query("DELETE FROM students WHERE register_no LIKE '7176210599%'");
    await pool.query("DELETE FROM student_whitelist WHERE register_no LIKE '7176210599%'");
    console.log('✓ Test data purged.');

    console.log('\n========================================================');
    console.log('ALL DUPLICATE PREVENTION TESTS COMPLETED WITH 100% PASS!');
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  }
}

runDuplicateTests();
