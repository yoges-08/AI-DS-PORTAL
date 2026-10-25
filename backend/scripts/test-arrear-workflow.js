const { pool, testConnection } = require('../config/db');
const { getStudentProfile, updateStudentDetails } = require('../controllers/studentController');

async function runArrearTests() {
  console.log('--- Starting Arrear Workflow Verification ---');
  await testConnection();

  const testRegNo = '71762105TEST';
  try {
    // 1. Clean up any previous test record
    await pool.query('DELETE FROM students WHERE register_no = ?', [testRegNo]);

    // 2. Insert test student
    const [ins] = await pool.query(
      `INSERT INTO students (register_no, name, dob, password, year, section, email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [testRegNo, 'Arrear Test Student', '2004-05-15', 'hash', 2, 'A', 'arreartest@gmail.com', 'DRAFT']
    );
    const studentId = ins.insertId;
    console.log(`✓ 1. Created test student with ID: ${studentId}`);

    // 3. Test saving arrear particulars (Yes, 2 subjects)
    const mockReqSave = {
      user: { id: studentId, role: 'STUDENT' },
      body: {
        hasArrears: true,
        arrearDetails: [
          { subjectCode: 'CS3351', subjectName: 'Digital Principles & Computer Organization', semester: 3, status: 'Standing' },
          { subjectCode: 'MA3151', subjectName: 'Matrices & Calculus', semester: 1, status: 'Cleared' }
        ]
      }
    };

    let saveStatusCode = 200;
    let saveJson = null;
    const mockResSave = {
      status(code) { saveStatusCode = code; return this; },
      json(data) { saveJson = data; return this; }
    };

    await updateStudentDetails(mockReqSave, mockResSave);
    if (!saveJson || !saveJson.success) {
      throw new Error(`Failed to save student arrear details: ${JSON.stringify(saveJson)}`);
    }
    console.log('✓ 2. updateStudentDetails saved hasArrears=true with 2 subjects successfully.');

    // 4. Test reading profile via getStudentProfile
    const mockReqGet = {
      user: { id: studentId, role: 'STUDENT' },
      params: {}
    };

    let getJson = null;
    const mockResGet = {
      status(code) { return this; },
      json(data) { getJson = data; return this; }
    };

    await getStudentProfile(mockReqGet, mockResGet);
    if (!getJson || !getJson.success || !getJson.student) {
      throw new Error(`Failed to retrieve student profile: ${JSON.stringify(getJson)}`);
    }

    const s = getJson.student;
    if (s.has_arrears !== true) {
      throw new Error(`Expected has_arrears to be true, got: ${s.has_arrears}`);
    }
    if (!Array.isArray(s.arrear_details) || s.arrear_details.length !== 2) {
      throw new Error(`Expected arrear_details array of length 2, got: ${JSON.stringify(s.arrear_details)}`);
    }
    if (s.arrear_details[0].subjectCode !== 'CS3351' || s.arrear_details[1].subjectCode !== 'MA3151') {
      throw new Error(`Subject codes mismatch in retrieved profile: ${JSON.stringify(s.arrear_details)}`);
    }
    console.log('✓ 3. getStudentProfile properly returned parsed has_arrears: true and 2 subject objects.');

    // 5. Test toggling arrears to false (No arrears)
    const mockReqClear = {
      user: { id: studentId, role: 'STUDENT' },
      body: {
        hasArrears: false,
        arrearDetails: []
      }
    };
    await updateStudentDetails(mockReqClear, mockResSave);

    await getStudentProfile(mockReqGet, mockResGet);
    if (getJson.student.has_arrears !== false) {
      throw new Error(`Expected has_arrears to be false, got: ${getJson.student.has_arrears}`);
    }
    console.log('✓ 4. Toggling hasArrears to false persisted cleanly.');

    // 6. Clean up
    await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
    console.log('✓ 5. Test student cleaned up.');

    console.log('\n=============================================');
    console.log('ALL ARREAR WORKFLOW TESTS PASSED PERFECTLY!');
    console.log('=============================================');
    process.exit(0);
  } catch (err) {
    console.error('Arrear Test Error:', err);
    process.exit(1);
  }
}

runArrearTests();
