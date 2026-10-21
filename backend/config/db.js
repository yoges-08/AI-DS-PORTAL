const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = require('bcryptjs');
}

dotenv.config();

let dbMode = 'mysql'; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;

// Initialize MySQL pool
try {
  const mysqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aids_portal',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  // Enable SSL/TLS for cloud MySQL (TiDB Cloud, Aiven, Clever Cloud)
  if (
    process.env.DB_SSL === 'true' ||
    (process.env.DB_HOST && (
      process.env.DB_HOST.includes('tidbcloud.com') ||
      process.env.DB_HOST.includes('aivencloud.com') ||
      process.env.DB_HOST.includes('clever-cloud.com')
    ))
  ) {
    mysqlConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    };
  }

  mysqlPool = mysql.createPool(mysqlConfig);
} catch (e) {
  // handled in testConnection
}

/**
 * Setup SQLite fallback database
 */
const initSqliteFallback = async () => {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const sqlitePath = path.join(__dirname, '..', 'aids_portal.sqlite');
    sqliteDb = new DatabaseSync(sqlitePath);

    // Create Tables
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        department TEXT DEFAULT 'Artificial Intelligence & Data Science',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        register_no TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        password TEXT NOT NULL,
        year INTEGER,
        section TEXT,
        gender TEXT,
        blood_group TEXT,
        religion TEXT,
        community TEXT,
        caste TEXT,
        nationality TEXT DEFAULT 'Indian',
        aadhaar_no TEXT,
        mother_tongue TEXT,
        photo_path TEXT,
        photo_data BLOB,
        mobile TEXT,
        alt_mobile TEXT,
        email TEXT,
        permanent_address TEXT,
        communication_address TEXT,
        is_same_address INTEGER DEFAULT 0,
        district TEXT,
        state TEXT DEFAULT 'Tamil Nadu',
        pincode TEXT,
        father_name TEXT,
        mother_name TEXT,
        guardian_name TEXT,
        parents_occupation TEXT,
        parents_mobile TEXT,
        annual_income REAL,
        sslc_school TEXT,
        sslc_board TEXT,
        sslc_year INTEGER,
        sslc_percentage REAL,
        hsc_school TEXT,
        hsc_board TEXT,
        hsc_year INTEGER,
        hsc_percentage REAL,
        current_semester INTEGER DEFAULT 1,
        mode_of_admission TEXT,
        is_first_graduate INTEGER DEFAULT 0,
        is_pms INTEGER DEFAULT 0,
        pms_application_no TEXT,
        pms_status TEXT DEFAULT 'N/A',
        other_scholarship_name TEXT,
        other_scholarship_amount REAL,
        other_scholarship_status TEXT,
        community_cert_no TEXT,
        community_cert_issuer TEXT,
        community_cert_date DATE,
        income_cert_no TEXT,
        income_cert_issuer TEXT,
        income_cert_date DATE,
        bank_acc_holder TEXT,
        bank_name TEXT,
        bank_acc_no TEXT,
        bank_ifsc TEXT,
        bank_branch TEXT,
        status TEXT DEFAULT 'DRAFT',
        is_locked INTEGER DEFAULT 0,
        locked_at DATETIME,
        locked_by TEXT,
        submission_date DATETIME,
        rejection_reason TEXT,
        declaration_accepted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        doc_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_data BLOB,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        admin_username TEXT NOT NULL,
        action TEXT NOT NULL,
        student_id INTEGER,
        student_reg_no TEXT,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
      );
    `);

    // Safe migration: ensure existing SQLite students table allows NULL for student-chosen year and section
    try {
      const cols = sqliteDb.prepare("PRAGMA table_info(students)").all();
      const yearCol = cols.find(c => c.name === 'year');
      const secCol = cols.find(c => c.name === 'section');
      if ((yearCol && yearCol.notnull) || (secCol && secCol.notnull)) {
        console.log('[DB Fallback] Upgrading local SQLite students schema to allow student-chosen Year and Section...');
        sqliteDb.exec(`
          PRAGMA foreign_keys=off;
          CREATE TABLE IF NOT EXISTS students_temp_migration (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            register_no TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            dob TEXT NOT NULL,
            password TEXT NOT NULL,
            year INTEGER,
            section TEXT,
            gender TEXT,
            blood_group TEXT,
            religion TEXT,
            community TEXT,
            caste TEXT,
            nationality TEXT DEFAULT 'Indian',
            aadhaar_no TEXT,
            mother_tongue TEXT,
            photo_path TEXT,
            mobile TEXT,
            alt_mobile TEXT,
            email TEXT,
            permanent_address TEXT,
            communication_address TEXT,
            is_same_address INTEGER DEFAULT 0,
            district TEXT,
            state TEXT DEFAULT 'Tamil Nadu',
            pincode TEXT,
            father_name TEXT,
            mother_name TEXT,
            guardian_name TEXT,
            parents_occupation TEXT,
            parents_mobile TEXT,
            annual_income REAL,
            sslc_school TEXT,
            sslc_board TEXT,
            sslc_year INTEGER,
            sslc_percentage REAL,
            hsc_school TEXT,
            hsc_board TEXT,
            hsc_year INTEGER,
            hsc_percentage REAL,
            current_semester INTEGER DEFAULT 1,
            mode_of_admission TEXT,
            is_first_graduate INTEGER DEFAULT 0,
            is_pms INTEGER DEFAULT 0,
            pms_application_no TEXT,
            pms_status TEXT DEFAULT 'N/A',
            other_scholarship_name TEXT,
            other_scholarship_amount REAL,
            other_scholarship_status TEXT,
            community_cert_no TEXT,
            community_cert_issuer TEXT,
            community_cert_date DATE,
            income_cert_no TEXT,
            income_cert_issuer TEXT,
            income_cert_date DATE,
            bank_acc_holder TEXT,
            bank_name TEXT,
            bank_acc_no TEXT,
            bank_ifsc TEXT,
            bank_branch TEXT,
            status TEXT DEFAULT 'DRAFT',
            is_locked INTEGER DEFAULT 0,
            locked_at DATETIME,
            locked_by TEXT,
            submission_date DATETIME,
            rejection_reason TEXT,
            declaration_accepted INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO students_temp_migration SELECT * FROM students;
          DROP TABLE students;
          ALTER TABLE students_temp_migration RENAME TO students;
          PRAGMA foreign_keys=on;
        `);
        console.log('[DB Fallback] Local SQLite students schema upgraded successfully.');
      }
    } catch (migErr) {
      console.warn('[DB Fallback] SQLite migration notice:', migErr.message);
    }

    // Ensure BLOB columns exist in local SQLite fallback
    try {
      const studentCols = sqliteDb.prepare("PRAGMA table_info(students)").all();
      if (!studentCols.some(c => c.name === 'photo_data')) {
        sqliteDb.exec('ALTER TABLE students ADD COLUMN photo_data BLOB;');
      }
      const docCols = sqliteDb.prepare("PRAGMA table_info(student_documents)").all();
      if (!docCols.some(c => c.name === 'file_data')) {
        sqliteDb.exec('ALTER TABLE student_documents ADD COLUMN file_data BLOB;');
      }
    } catch (e) {
      // ignore
    }

    // Check if admin exists in SQLite, if not seed
    const adminCheck = sqliteDb.prepare('SELECT id FROM admins LIMIT 1').all();
    if (adminCheck.length === 0) {
      console.log('[DB Fallback] Initializing default seed data in local database...');
      const adminPwd = await bcrypt.hash('Admin@123', 10);
      sqliteDb.prepare(`
        INSERT INTO admins (username, password, name, email, department)
        VALUES ('admin', ?, 'Dr. K. Rajasekaran, HOD', 'admin.aids@college.edu', 'Artificial Intelligence & Data Science')
      `).run(adminPwd);

      // Seed sample students
      const sampleStudents = [
        { reg: '71762105001', name: 'AARTHI S', dob: '2003-05-14', pwd: await bcrypt.hash('14052003', 10), year: 4, sec: 'A', status: 'SUBMITTED', fg: 1, pms: 0, comm: 'BC', mob: '9876543210' },
        { reg: '71762105002', name: 'BALAJI K', dob: '2003-08-22', pwd: await bcrypt.hash('22082003', 10), year: 4, sec: 'A', status: 'VERIFIED', locked: 1, fg: 0, pms: 1, comm: 'MBC', mob: '9845123456' },
        { reg: '71762105003', name: 'CHANDRU M', dob: '2003-11-30', pwd: await bcrypt.hash('30112003', 10), year: 4, sec: 'B', status: 'VERIFIED', locked: 1, fg: 0, pms: 1, comm: 'SC', mob: '9753124680' },
        { reg: '71762205015', name: 'DEEPALAKSHMI R', dob: '2004-03-18', pwd: await bcrypt.hash('18032004', 10), year: 3, sec: 'A', status: 'SUBMITTED', fg: 1, pms: 0, comm: 'BC', mob: '9632587410' },
        { reg: '71762205022', name: 'ELANGOVAN T', dob: '2004-07-09', pwd: await bcrypt.hash('09072004', 10), year: 3, sec: 'A', status: 'DRAFT', fg: 0, pms: 0, comm: 'BCM', mob: '9512345678' },
        { reg: '71762205035', name: 'HARINI V', dob: '2004-12-25', pwd: await bcrypt.hash('25122004', 10), year: 3, sec: 'B', status: 'DRAFT', fg: 0, pms: 0, comm: 'OC', mob: '9423456789' },
        { reg: '71762305008', name: 'KARTHIK N', dob: '2005-01-15', pwd: await bcrypt.hash('15012005', 10), year: 2, sec: 'A', status: 'SUBMITTED', fg: 1, pms: 1, comm: 'MBC', mob: '9312345678' },
        { reg: '71762305019', name: 'MONISHA P', dob: '2005-06-20', pwd: await bcrypt.hash('20062005', 10), year: 2, sec: 'B', status: 'SUBMITTED', fg: 1, pms: 1, comm: 'SCA', mob: '9212345678' },
        { reg: '71762405004', name: 'NAVEEN KUMAR S', dob: '2006-04-10', pwd: await bcrypt.hash('10042006', 10), year: 1, sec: 'A', status: 'DRAFT', fg: 0, pms: 0, comm: 'BC', mob: '9112345678' },
        { reg: '71762405028', name: 'PRIYADHARSHINI M', dob: '2006-09-05', pwd: await bcrypt.hash('05092006', 10), year: 1, sec: 'B', status: 'DRAFT', fg: 1, pms: 0, comm: 'DNC', mob: '9012345678' }
      ];

      const stmt = sqliteDb.prepare(`
        INSERT INTO students (
          register_no, name, dob, password, year, section, status, is_locked, 
          is_first_graduate, is_pms, pms_status, community, mobile, nationality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', ?, ?, 'Indian')
      `);

      for (const s of sampleStudents) {
        stmt.run(s.reg, s.name, s.dob, s.pwd, s.year, s.sec, s.status, s.locked || 0, s.fg, s.pms, s.comm, s.mob);
      }
      console.log(' -> Seeded 10 students into local fallback database.');
    }

    dbMode = 'sqlite';
    console.log('[DB] Local SQLite fallback active (backend/aids_portal.sqlite). Ready to accept requests!');
    return true;
  } catch (err) {
    console.error('[DB] SQLite fallback initialization failed:', err);
    return false;
  }
};

/**
 * Helper to serialize JavaScript types into SQLite-compatible primitives
 */
const toSqliteParam = (v) => {
  if (v === undefined) return null;
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return v;
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' && !Number.isFinite(v)) return null;
  return v;
};

/**
 * Universal pool wrapper
 */
const pool = {
  async query(sql, params = []) {
    if (dbMode === 'mysql') {
      // Direct query execution without silent divergence into SQLite
      return await mysqlPool.query(sql, params);
    }

    // SQLite Execution (only used if DB was intentionally initialized in sqlite mode)
    let cleanSql = sql
      .replace(/NOW\(\)/gi, "datetime('now', 'localtime')")
      .replace(/DATE_FORMAT\(([^,]+),\s*'[^']+'\)/gi, "strftime('%d-%m-%Y %H:%M', $1)");

    const isSelect = /^\s*SELECT/i.test(cleanSql);
    const safeParams = params.map(toSqliteParam);

    try {
      const stmt = sqliteDb.prepare(cleanSql);
      if (isSelect) {
        const rows = stmt.all(...safeParams);
        return [rows, []];
      } else {
        const info = stmt.run(...safeParams);
        return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
      }
    } catch (sqliteErr) {
      console.error('[SQLite Query Error]:', sqliteErr.message, '\nSQL:', cleanSql);
      throw sqliteErr;
    }
  },

  async getConnection() {
    if (dbMode === 'mysql') {
      return await mysqlPool.getConnection();
    }
    // Transaction-safe shim for SQLite / mock connection
    return {
      query: (sql, params) => pool.query(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
};

/**
 * Test Connection Helper
 */
const testConnection = async () => {
  try {
    const conn = await mysqlPool.getConnection();
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'aids_portal'}" at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    try {
      await conn.query('ALTER TABLE `students` MODIFY `year` INT NULL, MODIFY `section` VARCHAR(5) NULL;');
    } catch (migErr) {
      // Ignore if columns are already nullable or table not created yet
    }
    try {
      await conn.query('ALTER TABLE `student_documents` ADD COLUMN IF NOT EXISTS `file_data` LONGBLOB NULL;');
    } catch (migErr) {
      // Ignore if column exists
    }
    try {
      await conn.query('ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `photo_data` LONGBLOB NULL;');
    } catch (migErr) {
      // Ignore if column exists
    }

    conn.release();
    dbMode = 'mysql';
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[DB Fatal] MySQL is not responding on port ${process.env.DB_PORT || '3306'} in production mode. Refusing silent fallback.`);
      process.exit(1);
    }
    console.warn(`[DB] MySQL is not responding on port ${process.env.DB_PORT || '3306'} (${error.code || error.message}).`);
    console.log('[DB] Activating built-in zero-config local database (aids_portal.sqlite)...');
    return await initSqliteFallback();
  }
};

module.exports = {
  pool,
  testConnection,
  getDbMode: () => dbMode
};
