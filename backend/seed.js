const mysql = require('mysql2/promise');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}
const dotenv = require('dotenv');

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'aids_portal';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);

const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seeding is strictly disabled in production mode.');
    process.exit(1);
  }

  console.log('====================================================');
  console.log('Department Student Information System - Setup & Seed');
  console.log('====================================================');
  console.log(`[1/4] Connecting to MySQL server at ${DB_HOST}:${DB_PORT} as "${DB_USER}"...`);

  let connection;
  try {
    const connectionConfig = {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    };

    if (
      process.env.DB_SSL === 'true' ||
      (DB_HOST && (
        DB_HOST.includes('tidbcloud.com') ||
        DB_HOST.includes('aivencloud.com') ||
        DB_HOST.includes('clever-cloud.com')
      ))
    ) {
      connectionConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      };
    }

    connection = await mysql.createConnection(connectionConfig);
    console.log(' -> Connected to MySQL server successfully.');

    // 1. Create Database if not exists
    console.log(`\n[2/4] Ensuring database "${DB_NAME}" exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(` -> Database "${DB_NAME}" is ready.`);

    // 2. Create Tables if they don't exist
    console.log('\n[3/4] Ensuring tables (admins, students, student_documents, audit_logs) exist...');
    
    // Admins
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(100) NULL,
        \`department\` VARCHAR(100) NOT NULL DEFAULT 'Artificial Intelligence & Data Science',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Students
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`students\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`register_no\` VARCHAR(20) NOT NULL UNIQUE,
        \`name\` VARCHAR(100) NOT NULL,
        \`dob\` VARCHAR(10) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`year\` INT NULL,
        \`section\` VARCHAR(5) NULL,
        \`gender\` VARCHAR(20) NULL,
        \`blood_group\` VARCHAR(10) NULL,
        \`religion\` VARCHAR(50) NULL,
        \`community\` VARCHAR(20) NULL,
        \`caste\` VARCHAR(100) NULL,
        \`nationality\` VARCHAR(50) DEFAULT 'Indian',
        \`aadhaar_no\` VARCHAR(12) NULL,
        \`mother_tongue\` VARCHAR(50) NULL,
        \`photo_path\` VARCHAR(255) NULL,
        \`photo_data\` LONGBLOB NULL,
        \`mobile\` VARCHAR(15) NULL,
        \`alt_mobile\` VARCHAR(15) NULL,
        \`email\` VARCHAR(100) NULL,
        \`permanent_address\` TEXT NULL,
        \`communication_address\` TEXT NULL,
        \`is_same_address\` TINYINT(1) DEFAULT 0,
        \`district\` VARCHAR(100) NULL,
        \`state\` VARCHAR(100) DEFAULT 'Tamil Nadu',
        \`pincode\` VARCHAR(10) NULL,
        \`father_name\` VARCHAR(100) NULL,
        \`mother_name\` VARCHAR(100) NULL,
        \`guardian_name\` VARCHAR(100) NULL,
        \`parents_occupation\` VARCHAR(100) NULL,
        \`parents_mobile\` VARCHAR(15) NULL,
        \`annual_income\` DECIMAL(12, 2) NULL,
        \`sslc_school\` VARCHAR(150) NULL,
        \`sslc_board\` VARCHAR(100) NULL,
        \`sslc_year\` INT NULL,
        \`sslc_percentage\` DECIMAL(5, 2) NULL,
        \`hsc_school\` VARCHAR(150) NULL,
        \`hsc_board\` VARCHAR(100) NULL,
        \`hsc_year\` INT NULL,
        \`hsc_percentage\` DECIMAL(5, 2) NULL,
        \`current_semester\` INT DEFAULT 1,
        \`mode_of_admission\` VARCHAR(50) NULL,
        \`is_first_graduate\` TINYINT(1) DEFAULT 0,
        \`is_pms\` TINYINT(1) DEFAULT 0,
        \`pms_application_no\` VARCHAR(50) NULL,
        \`pms_status\` VARCHAR(50) DEFAULT 'N/A',
        \`other_scholarship_name\` VARCHAR(100) NULL,
        \`other_scholarship_amount\` DECIMAL(10, 2) NULL,
        \`other_scholarship_status\` VARCHAR(50) NULL,
        \`community_cert_no\` VARCHAR(50) NULL,
        \`community_cert_issuer\` VARCHAR(100) NULL,
        \`community_cert_date\` DATE NULL,
        \`income_cert_no\` VARCHAR(50) NULL,
        \`income_cert_issuer\` VARCHAR(100) NULL,
        \`income_cert_date\` DATE NULL,
        \`bank_acc_holder\` VARCHAR(100) NULL,
        \`bank_name\` VARCHAR(100) NULL,
        \`bank_acc_no\` VARCHAR(30) NULL,
        \`bank_ifsc\` VARCHAR(15) NULL,
        \`bank_branch\` VARCHAR(100) NULL,
        \`status\` ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED') DEFAULT 'DRAFT',
        \`is_locked\` TINYINT(1) DEFAULT 0,
        \`locked_at\` TIMESTAMP NULL,
        \`locked_by\` VARCHAR(50) NULL,
        \`submission_date\` TIMESTAMP NULL,
        \`rejection_reason\` TEXT NULL,
        \`declaration_accepted\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_reg_no\` (\`register_no\`),
        INDEX \`idx_year_sec\` (\`year\`, \`section\`),
        INDEX \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Student Documents
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`student_documents\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`student_id\` INT NOT NULL,
        \`doc_type\` VARCHAR(50) NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_path\` VARCHAR(255) NOT NULL,
        \`file_size\` INT NOT NULL,
        \`mime_type\` VARCHAR(50) NOT NULL,
        \`file_data\` LONGBLOB NULL,
        \`uploaded_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_docs_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Audit Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`admin_id\` INT NULL,
        \`admin_username\` VARCHAR(50) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`student_id\` INT NULL,
        \`student_reg_no\` VARCHAR(50) NULL,
        \`details\` TEXT NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_audit_admin\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admins\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_audit_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(' -> Database tables verified and created successfully.');

    // Safe migration for existing MySQL database to allow NULL for student-chosen year and section
    try {
      await connection.query('ALTER TABLE `students` MODIFY `year` INT NULL, MODIFY `section` VARCHAR(5) NULL;');
    } catch (migErr) {
      // Ignore if table was just created or columns are already nullable
    }

    // 3. Seed Admin
    console.log('\n[4/4] Seeding default administrator and 10 students...');
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.length < 8) {
      console.error('Error: Please provide DEFAULT_ADMIN_PASSWORD (min 8 chars) in environment to run seed.');
      process.exit(1);
    }
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    const [adminExists] = await connection.query(
      'SELECT id FROM admins WHERE username = ?',
      [adminUsername]
    );

    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'aamecaidsskill@gmail.com';

    if (adminExists.length === 0) {
      await connection.query(
        `INSERT INTO admins (username, password, name, email, department, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          adminUsername,
          hashedAdminPassword,
          'Dr.G.NANTHAKUMAR',
          defaultEmail,
          'Artificial Intelligence & Data Science'
        ]
      );
      console.log(` -> Admin (HOD) seeded: username="${adminUsername}"`);
    } else {
      await connection.query(
        'UPDATE admins SET name = ?, email = ? WHERE username = ?',
        ['Dr.G.NANTHAKUMAR', defaultEmail, adminUsername]
      );
      console.log(` -> Admin "${adminUsername}" verified.`);
    }

    // Seed Department Faculty Accounts
    const facultyList = [
      { username: 'chitra.tk', name: 'T.K.CHITRA' },
      { username: 'jeeva.m', name: 'M.JEEVA' },
      { username: 'selvarani.n', name: 'N.SELVARANI' },
      { username: 'jayanthi.k', name: 'JAYANTHI K' }
    ];
    const facultyPassword = process.env.DEFAULT_FACULTY_PASSWORD || adminPassword;
    const defaultFacultyPassword = await bcrypt.hash(facultyPassword, 12);

    for (const fac of facultyList) {
      const [facExists] = await connection.query('SELECT id FROM admins WHERE username = ?', [fac.username]);
      if (facExists.length === 0) {
        await connection.query(
          `INSERT INTO admins (username, password, name, email, department, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [fac.username, defaultFacultyPassword, fac.name, defaultEmail, 'Artificial Intelligence & Data Science']
        );
        console.log(` -> Faculty account seeded: ${fac.name} (${fac.username})`);
      } else {
        await connection.query('UPDATE admins SET name = ?, email = ? WHERE username = ?', [fac.name, defaultEmail, fac.username]);
        console.log(` -> Faculty account verified: ${fac.name} (${fac.username})`);
      }
    }

    // 4. Seed 10 Students
    const sampleStudents = [
      {
        registerNo: '71762105001',
        name: 'AARTHI S',
        dob: '2003-05-14',
        year: 4,
        section: 'A',
        gender: 'Female',
        bloodGroup: 'B+',
        religion: 'Hindu',
        community: 'BC',
        caste: 'Kongu Vellalar',
        nationality: 'Indian',
        aadhaarNo: '456789123456',
        motherTongue: 'Tamil',
        mobile: '9876543210',
        altMobile: '9876543211',
        email: 'aarthi.s@student.college.edu',
        permanentAddress: '12, Gandhi Street, Perundurai',
        communicationAddress: '12, Gandhi Street, Perundurai',
        isSameAddress: 1,
        district: 'Erode',
        state: 'Tamil Nadu',
        pincode: '638052',
        fatherName: 'Subramanian K',
        motherName: 'Revathi S',
        guardianName: 'Subramanian K',
        parentsOccupation: 'Agriculture',
        parentsMobile: '9443322110',
        annualIncome: 120000.00,
        sslcSchool: 'Government Higher Secondary School, Perundurai',
        sslcBoard: 'State Board',
        sslcYear: 2019,
        sslcPercentage: 92.40,
        hscSchool: 'Government Boys Higher Secondary School, Erode',
        hscBoard: 'State Board',
        hscYear: 2021,
        hscPercentage: 89.50,
        currentSemester: 8,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 1,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'AARTHI S',
        bankName: 'State Bank of India',
        bankAccNo: '34567891234',
        bankIfsc: 'SBIN0001234',
        bankBranch: 'Perundurai ADB',
        status: 'SUBMITTED',
        isLocked: 0,
        declarationAccepted: 1,
        submissionDate: new Date()
      },
      {
        registerNo: '71762105002',
        name: 'BALAJI K',
        dob: '2003-08-22',
        year: 4,
        section: 'A',
        gender: 'Male',
        bloodGroup: 'O+',
        religion: 'Hindu',
        community: 'MBC',
        caste: 'Vanniyar',
        nationality: 'Indian',
        aadhaarNo: '567891234567',
        motherTongue: 'Tamil',
        mobile: '9845123456',
        altMobile: '9845123457',
        email: 'balaji.k@student.college.edu',
        permanentAddress: '45, Salem Main Road, Mettur Dam',
        communicationAddress: 'College Hostel, Room 204, Campus',
        isSameAddress: 0,
        district: 'Salem',
        state: 'Tamil Nadu',
        pincode: '636401',
        fatherName: 'Krishnan M',
        motherName: 'Lakshmi K',
        guardianName: 'Krishnan M',
        parentsOccupation: 'Weaver',
        parentsMobile: '9786543210',
        annualIncome: 95000.00,
        sslcSchool: 'St. Marys High School, Mettur',
        sslcBoard: 'State Board',
        sslcYear: 2019,
        sslcPercentage: 88.00,
        hscSchool: 'Government Boys HSS, Salem',
        hscBoard: 'State Board',
        hscYear: 2021,
        hscPercentage: 86.25,
        currentSemester: 8,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 0,
        isPms: 1,
        pmsApplicationNo: 'PMS2023TN8901',
        pmsStatus: 'Approved',
        bankAccHolder: 'BALAJI K',
        bankName: 'Canara Bank',
        bankAccNo: '123456789012',
        bankIfsc: 'CNRB0002345',
        bankBranch: 'Mettur Dam',
        status: 'VERIFIED',
        isLocked: 1,
        lockedAt: new Date(),
        lockedBy: 'admin',
        declarationAccepted: 1,
        submissionDate: new Date('2024-02-15')
      },
      {
        registerNo: '71762105003',
        name: 'CHANDRU M',
        dob: '2003-11-30',
        year: 4,
        section: 'B',
        gender: 'Male',
        bloodGroup: 'A+',
        religion: 'Hindu',
        community: 'SC',
        caste: 'Adi Dravidar',
        nationality: 'Indian',
        aadhaarNo: '678912345678',
        motherTongue: 'Tamil',
        mobile: '9753124680',
        altMobile: '9753124681',
        email: 'chandru.m@student.college.edu',
        permanentAddress: '78, Kamarajar Street, Namakkal',
        communicationAddress: '78, Kamarajar Street, Namakkal',
        isSameAddress: 1,
        district: 'Namakkal',
        state: 'Tamil Nadu',
        pincode: '637001',
        fatherName: 'Murugan P',
        motherName: 'Vasantha M',
        guardianName: 'Murugan P',
        parentsOccupation: 'Daily Wage',
        parentsMobile: '9654321098',
        annualIncome: 72000.00,
        sslcSchool: 'Municipal High School, Namakkal',
        sslcBoard: 'State Board',
        sslcYear: 2019,
        sslcPercentage: 85.60,
        hscSchool: 'Govt Model HSS, Namakkal',
        hscBoard: 'State Board',
        hscYear: 2021,
        hscPercentage: 84.10,
        currentSemester: 8,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 0,
        isPms: 1,
        pmsApplicationNo: 'PMS2023TN4421',
        pmsStatus: 'Disbursed',
        bankAccHolder: 'CHANDRU M',
        bankName: 'Indian Overseas Bank',
        bankAccNo: '987654321098',
        bankIfsc: 'IOBA0003456',
        bankBranch: 'Namakkal Town',
        status: 'VERIFIED',
        isLocked: 1,
        lockedAt: new Date(),
        lockedBy: 'admin',
        declarationAccepted: 1,
        submissionDate: new Date('2024-02-18')
      },
      {
        registerNo: '71762205015',
        name: 'DEEPALAKSHMI R',
        dob: '2004-03-18',
        year: 3,
        section: 'A',
        gender: 'Female',
        bloodGroup: 'O-',
        religion: 'Hindu',
        community: 'BC',
        caste: 'Nadar',
        nationality: 'Indian',
        aadhaarNo: '789123456789',
        motherTongue: 'Tamil',
        mobile: '9632587410',
        altMobile: '9632587411',
        email: 'deepa.r@student.college.edu',
        permanentAddress: '15, South Car Street, Tirunelveli',
        communicationAddress: '15, South Car Street, Tirunelveli',
        isSameAddress: 1,
        district: 'Tirunelveli',
        state: 'Tamil Nadu',
        pincode: '627001',
        fatherName: 'Ramasamy T',
        motherName: 'Meenakshi R',
        guardianName: 'Ramasamy T',
        parentsOccupation: 'Grocery Merchant',
        parentsMobile: '9543210987',
        annualIncome: 180000.00,
        sslcSchool: 'Sarah Tucker Girls HSS, Palayamkottai',
        sslcBoard: 'State Board',
        sslcYear: 2020,
        sslcPercentage: 94.20,
        hscSchool: 'Sarah Tucker Girls HSS, Palayamkottai',
        hscBoard: 'State Board',
        hscYear: 2022,
        hscPercentage: 91.80,
        currentSemester: 6,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 1,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'DEEPALAKSHMI R',
        bankName: 'Indian Bank',
        bankAccNo: '567890123456',
        bankIfsc: 'IDIB0004567',
        bankBranch: 'Tirunelveli Junction',
        status: 'SUBMITTED',
        isLocked: 0,
        declarationAccepted: 1,
        submissionDate: new Date()
      },
      {
        registerNo: '71762205022',
        name: 'ELANGOVAN T',
        dob: '2004-07-09',
        year: 3,
        section: 'A',
        gender: 'Male',
        bloodGroup: 'B-',
        religion: 'Muslim',
        community: 'BCM',
        caste: 'Muslim Labbai',
        nationality: 'Indian',
        aadhaarNo: '891234567890',
        motherTongue: 'Tamil',
        mobile: '9512345678',
        altMobile: '9512345679',
        email: 'elangovan.t@student.college.edu',
        permanentAddress: '88, Mosque Street, Vaniyambadi',
        communicationAddress: '88, Mosque Street, Vaniyambadi',
        isSameAddress: 1,
        district: 'Tirupattur',
        state: 'Tamil Nadu',
        pincode: '635751',
        fatherName: 'Tajudeen A',
        motherName: 'Fathima T',
        guardianName: 'Tajudeen A',
        parentsOccupation: 'Leather Works',
        parentsMobile: '9432109876',
        annualIncome: 140000.00,
        sslcSchool: 'Islamiah Boys High School, Vaniyambadi',
        sslcBoard: 'State Board',
        sslcYear: 2020,
        sslcPercentage: 81.50,
        hscSchool: 'Islamiah Boys HSS, Vaniyambadi',
        hscBoard: 'State Board',
        hscYear: 2022,
        hscPercentage: 79.40,
        currentSemester: 6,
        modeOfAdmission: 'Management Quota',
        isFirstGraduate: 0,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'ELANGOVAN T',
        bankName: 'Punjab National Bank',
        bankAccNo: '678901234567',
        bankIfsc: 'PUNB0005678',
        bankBranch: 'Vaniyambadi',
        status: 'DRAFT',
        isLocked: 0,
        declarationAccepted: 0,
        submissionDate: null
      },
      {
        registerNo: '71762205035',
        name: 'HARINI V',
        dob: '2004-12-25',
        year: 3,
        section: 'B',
        gender: 'Female',
        bloodGroup: 'AB+',
        religion: 'Hindu',
        community: 'OC',
        caste: 'Brahmin',
        nationality: 'Indian',
        aadhaarNo: '912345678901',
        motherTongue: 'Tamil',
        mobile: '9423456789',
        altMobile: '9423456780',
        email: 'harini.v@student.college.edu',
        permanentAddress: '24, West Mada Street, Mylapore, Chennai',
        communicationAddress: '24, West Mada Street, Mylapore, Chennai',
        isSameAddress: 1,
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600004',
        fatherName: 'Vaidyanathan S',
        motherName: 'Kalyani V',
        guardianName: 'Vaidyanathan S',
        parentsOccupation: 'Private Service',
        parentsMobile: '9321098765',
        annualIncome: 450000.00,
        sslcSchool: 'PS Senior Secondary School, Mylapore',
        sslcBoard: 'CBSE',
        sslcYear: 2020,
        sslcPercentage: 96.00,
        hscSchool: 'PS Senior Secondary School, Mylapore',
        hscBoard: 'CBSE',
        hscYear: 2022,
        hscPercentage: 93.60,
        currentSemester: 6,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 0,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'HARINI V',
        bankName: 'HDFC Bank',
        bankAccNo: '50100234567890',
        bankIfsc: 'HDFC0001234',
        bankBranch: 'Mylapore',
        status: 'DRAFT',
        isLocked: 0,
        declarationAccepted: 0,
        submissionDate: null
      },
      {
        registerNo: '71762305008',
        name: 'KARTHIK N',
        dob: '2005-01-15',
        year: 2,
        section: 'A',
        gender: 'Male',
        bloodGroup: 'O+',
        religion: 'Hindu',
        community: 'MBC',
        caste: 'Maravar',
        nationality: 'Indian',
        aadhaarNo: '123456789012',
        motherTongue: 'Tamil',
        mobile: '9312345678',
        altMobile: '9312345679',
        email: 'karthik.n@student.college.edu',
        permanentAddress: '10, Thevar Street, Sivagangai',
        communicationAddress: '10, Thevar Street, Sivagangai',
        isSameAddress: 1,
        district: 'Sivagangai',
        state: 'Tamil Nadu',
        pincode: '630561',
        fatherName: 'Natarajan M',
        motherName: 'Selvi N',
        guardianName: 'Natarajan M',
        parentsOccupation: 'Farmer',
        parentsMobile: '9210987654',
        annualIncome: 85000.00,
        sslcSchool: 'Govt Boys HSS, Sivagangai',
        sslcBoard: 'State Board',
        sslcYear: 2021,
        sslcPercentage: 87.20,
        hscSchool: 'Govt Boys HSS, Sivagangai',
        hscBoard: 'State Board',
        hscYear: 2023,
        hscPercentage: 84.50,
        currentSemester: 4,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 1,
        isPms: 1,
        pmsApplicationNo: 'PMS2024TN6612',
        pmsStatus: 'Applied',
        bankAccHolder: 'KARTHIK N',
        bankName: 'State Bank of India',
        bankAccNo: '33445566778',
        bankIfsc: 'SBIN0006789',
        bankBranch: 'Sivagangai Main',
        status: 'SUBMITTED',
        isLocked: 0,
        declarationAccepted: 1,
        submissionDate: new Date()
      },
      {
        registerNo: '71762305019',
        name: 'MONISHA P',
        dob: '2005-06-20',
        year: 2,
        section: 'B',
        gender: 'Female',
        bloodGroup: 'A-',
        religion: 'Hindu',
        community: 'SCA',
        caste: 'Arunthathiyar',
        nationality: 'Indian',
        aadhaarNo: '234567890123',
        motherTongue: 'Tamil',
        mobile: '9212345678',
        altMobile: '9212345679',
        email: 'monisha.p@student.college.edu',
        permanentAddress: '55, Anna Nagar, Gobichettipalayam',
        communicationAddress: '55, Anna Nagar, Gobichettipalayam',
        isSameAddress: 1,
        district: 'Erode',
        state: 'Tamil Nadu',
        pincode: '638452',
        fatherName: 'Palanisamy K',
        motherName: 'Chitra P',
        guardianName: 'Palanisamy K',
        parentsOccupation: 'Agricultural Laborer',
        parentsMobile: '9109876543',
        annualIncome: 65000.00,
        sslcSchool: 'Municipal Girls HSS, Gobi',
        sslcBoard: 'State Board',
        sslcYear: 2021,
        sslcPercentage: 89.80,
        hscSchool: 'Municipal Girls HSS, Gobi',
        hscBoard: 'State Board',
        hscYear: 2023,
        hscPercentage: 88.00,
        currentSemester: 4,
        modeOfAdmission: '7.5% Govt School Quota',
        isFirstGraduate: 1,
        isPms: 1,
        pmsApplicationNo: 'PMS2024TN7723',
        pmsStatus: 'Approved',
        bankAccHolder: 'MONISHA P',
        bankName: 'Indian Bank',
        bankAccNo: '789012345678',
        bankIfsc: 'IDIB0007890',
        bankBranch: 'Gobichettipalayam',
        status: 'SUBMITTED',
        isLocked: 0,
        declarationAccepted: 1,
        submissionDate: new Date()
      },
      {
        registerNo: '71762405004',
        name: 'NAVEEN KUMAR S',
        dob: '2006-04-10',
        year: 1,
        section: 'A',
        gender: 'Male',
        bloodGroup: 'B+',
        religion: 'Hindu',
        community: 'BC',
        caste: 'Yadava',
        nationality: 'Indian',
        aadhaarNo: '345678901234',
        motherTongue: 'Tamil',
        mobile: '9112345678',
        altMobile: '9112345679',
        email: 'naveen.s@student.college.edu',
        permanentAddress: '14, Cross Cut Road, Gandhipuram, Coimbatore',
        communicationAddress: '14, Cross Cut Road, Gandhipuram, Coimbatore',
        isSameAddress: 1,
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641012',
        fatherName: 'Senthilkumar R',
        motherName: 'Uma S',
        guardianName: 'Senthilkumar R',
        parentsOccupation: 'Electrical Contractor',
        parentsMobile: '9098765432',
        annualIncome: 220000.00,
        sslcSchool: 'Mani Higher Secondary School, Coimbatore',
        sslcBoard: 'State Board',
        sslcYear: 2022,
        sslcPercentage: 91.00,
        hscSchool: 'Mani Higher Secondary School, Coimbatore',
        hscBoard: 'State Board',
        hscYear: 2024,
        hscPercentage: 87.50,
        currentSemester: 2,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 0,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'NAVEEN KUMAR S',
        bankName: 'Canara Bank',
        bankAccNo: '890123456789',
        bankIfsc: 'CNRB0008901',
        bankBranch: 'Gandhipuram',
        status: 'DRAFT',
        isLocked: 0,
        declarationAccepted: 0,
        submissionDate: null
      },
      {
        registerNo: '71762405028',
        name: 'PRIYADHARSHINI M',
        dob: '2006-09-05',
        year: 1,
        section: 'B',
        gender: 'Female',
        bloodGroup: 'O+',
        religion: 'Hindu',
        community: 'DNC',
        caste: 'Kallar',
        nationality: 'Indian',
        aadhaarNo: '456789012345',
        motherTongue: 'Tamil',
        mobile: '9012345678',
        altMobile: '9012345679',
        email: 'priya.m@student.college.edu',
        permanentAddress: '63, North Veli Street, Madurai',
        communicationAddress: '63, North Veli Street, Madurai',
        isSameAddress: 1,
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
        fatherName: 'Murugesan V',
        motherName: 'Devi M',
        guardianName: 'Murugesan V',
        parentsOccupation: 'Small Business',
        parentsMobile: '8987654321',
        annualIncome: 135000.00,
        sslcSchool: 'Capron Hall Girls HSS, Madurai',
        sslcBoard: 'State Board',
        sslcYear: 2022,
        sslcPercentage: 93.40,
        hscSchool: 'Capron Hall Girls HSS, Madurai',
        hscBoard: 'State Board',
        hscYear: 2024,
        hscPercentage: 90.20,
        currentSemester: 2,
        modeOfAdmission: 'Government Quota',
        isFirstGraduate: 1,
        isPms: 0,
        pmsApplicationNo: null,
        pmsStatus: 'N/A',
        bankAccHolder: 'PRIYADHARSHINI M',
        bankName: 'State Bank of India',
        bankAccNo: '901234567890',
        bankIfsc: 'SBIN0009012',
        bankBranch: 'Madurai Town',
        status: 'DRAFT',
        isLocked: 0,
        declarationAccepted: 0,
        submissionDate: null
      }
    ];

    for (const student of sampleStudents) {
      const [existing] = await connection.query(
        'SELECT id FROM students WHERE register_no = ?',
        [student.registerNo]
      );

      const dobParts = student.dob.split('-');
      const pwd = `${dobParts[2]}${dobParts[1]}${dobParts[0]}`;
      const hashedPassword = await bcrypt.hash(pwd, 10);

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO students (
            register_no, name, dob, password, year, section, gender, blood_group, religion,
            community, caste, nationality, aadhaar_no, mother_tongue, mobile, alt_mobile,
            email, permanent_address, communication_address, is_same_address, district, state,
            pincode, father_name, mother_name, guardian_name, parents_occupation, parents_mobile,
            annual_income, sslc_school, sslc_board, sslc_year, sslc_percentage, hsc_school,
            hsc_board, hsc_year, hsc_percentage, current_semester, mode_of_admission,
            is_first_graduate, is_pms, pms_application_no, pms_status, bank_acc_holder,
            bank_name, bank_acc_no, bank_ifsc, bank_branch, status, is_locked, locked_at,
            locked_by, declaration_accepted, submission_date, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            student.registerNo,
            student.name,
            student.dob,
            hashedPassword,
            student.year,
            student.section,
            student.gender,
            student.bloodGroup,
            student.religion,
            student.community,
            student.caste,
            student.nationality,
            student.aadhaarNo,
            student.motherTongue,
            student.mobile,
            student.altMobile,
            student.email,
            student.permanentAddress,
            student.communicationAddress,
            student.isSameAddress,
            student.district,
            student.state,
            student.pincode,
            student.fatherName,
            student.motherName,
            student.guardianName,
            student.parentsOccupation,
            student.parentsMobile,
            student.annualIncome,
            student.sslcSchool,
            student.sslcBoard,
            student.sslcYear,
            student.sslcPercentage,
            student.hscSchool,
            student.hscBoard,
            student.hscYear,
            student.hscPercentage,
            student.currentSemester,
            student.modeOfAdmission,
            student.isFirstGraduate,
            student.isPms,
            student.pmsApplicationNo,
            student.pmsStatus,
            student.bankAccHolder,
            student.bankName,
            student.bankAccNo,
            student.bankIfsc,
            student.bankBranch,
            student.status,
            student.isLocked,
            student.lockedAt || null,
            student.lockedBy || null,
            student.declarationAccepted,
            student.submissionDate || null
          ]
        );
        console.log(` -> Seeded: ${student.registerNo} - ${student.name} (DOB: ${student.dob}, )`);
      } else {
        console.log(` -> Student ${student.registerNo} already exists.`);
      }
    }

    console.log('\n====================================================');
    console.log('Setup and Seeding Completed Successfully!');
    console.log('Database Name: aids_portal');
    console.log('Admin accounts created via: node scripts/create-admin.js');
    // Sample Student login via self-signup or admin reset
    console.log('====================================================\n');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n[Setup/Seeding Failed]:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n--> CRITICAL: Could not connect to MySQL server at ' + DB_HOST + ':' + DB_PORT);
      console.error('--> Make sure MySQL is running (e.g. Start Apache/MySQL in XAMPP, or start MySQL Service).');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n--> CRITICAL: MySQL authentication failed for user "' + DB_USER + '".');
      console.error('--> Please update DB_PASSWORD in backend/.env to match your MySQL password.');
    }
    if (connection) await connection.end().catch(() => {});
    process.exit(1);
  }
};

seedDatabase();
