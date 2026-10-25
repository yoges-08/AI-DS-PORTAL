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
      // S9 fix: Verify TLS certificate by default. Only explicitly disabled if set to 'false'.
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
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

      CREATE TABLE IF NOT EXISTS student_whitelist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        register_no TEXT UNIQUE NOT NULL,
        dob TEXT NOT NULL,
        claim_code_hash TEXT,
        email TEXT,
        is_claimed INTEGER DEFAULT 0,
        claimed_student_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (claimed_student_id) REFERENCES students(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS auth_lockouts (
        key_name TEXT PRIMARY KEY,
        failures INTEGER NOT NULL DEFAULT 0,
        first_attempt_ms INTEGER NOT NULL,
        locked_until_ms INTEGER NOT NULL DEFAULT 0
      );
    
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE NOT NULL,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        last_sent_at INTEGER NOT NULL,
        resend_count INTEGER NOT NULL DEFAULT 0,
        resend_window_start INTEGER NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        to_email TEXT,
        template TEXT NOT NULL,
        status TEXT NOT NULL,
        provider_message_id TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      try { sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_student_doc ON student_documents(student_id, doc_type);'); } catch (e) {}
      if (!studentCols.some(c => c.name === 'token_version')) {
        sqliteDb.exec('ALTER TABLE students ADD COLUMN token_version INTEGER DEFAULT 1;');
      }
            if (!studentCols.some(c => c.name === 'email_verified')) {
        sqliteDb.exec('ALTER TABLE students ADD COLUMN email_verified INTEGER DEFAULT 1;');
      }
      if (!studentCols.some(c => c.name === 'must_change_password')) {
        sqliteDb.exec('ALTER TABLE students ADD COLUMN must_change_password INTEGER DEFAULT 0;');
      }
      const adminCols = sqliteDb.prepare("PRAGMA table_info(admins)").all();
      if (!adminCols.some(c => c.name === 'token_version')) {
        sqliteDb.exec('ALTER TABLE admins ADD COLUMN token_version INTEGER DEFAULT 1;');
      }
      const whitelistCols = sqliteDb.prepare("PRAGMA table_info(student_whitelist)").all();
      if (!whitelistCols.some(c => c.name === 'claim_code_hash')) {
        sqliteDb.exec('ALTER TABLE student_whitelist ADD COLUMN claim_code_hash TEXT;');
      }
      if (!whitelistCols.some(c => c.name === 'email')) {
        sqliteDb.exec('ALTER TABLE student_whitelist ADD COLUMN email TEXT;');
      }

      // Backfill any existing students into student_whitelist as claimed
      const allStudents = sqliteDb.prepare('SELECT id, register_no, dob FROM students').all();
      const insertWhitelist = sqliteDb.prepare('INSERT OR IGNORE INTO student_whitelist (register_no, dob, is_claimed, claimed_student_id) VALUES (?, ?, 1, ?)');
      for (const st of allStudents) {
        insertWhitelist.run(st.register_no, st.dob, st.id);
      }
    } catch (e) {
      // ignore
    }

    // Verify admins table state in SQLite (S2 fix: default hardcoded credentials removed)
    const adminCheck = sqliteDb.prepare("SELECT COUNT(*) AS count FROM admins").all();
    if (adminCheck[0]?.count === 0) {
      console.log('[DB Fallback] Notice: No admin account found. Create one securely using: node scripts/create-admin.js <username> "<Full Name>" <email> <password>');
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
      .replace(/DATE_FORMAT\(([^,]+),\s*'[^']+'\)/gi, "strftime('%d-%m-%Y %H:%M', $1)")
      .replace(/\s+FOR\s+UPDATE/gi, '');

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
    // Transaction-safe shim for SQLite fallback (X5 fix)
    let inTransaction = false;
    return {
      query: (sql, params) => pool.query(sql, params),
      beginTransaction: async () => {
        if (!inTransaction && sqliteDb) {
          try {
            sqliteDb.exec('BEGIN IMMEDIATE');
            inTransaction = true;
          } catch (e) {
            // Ignore if transaction already active
          }
        }
      },
      commit: async () => {
        if (inTransaction && sqliteDb) {
          try {
            sqliteDb.exec('COMMIT');
          } finally {
            inTransaction = false;
          }
        }
      },
      rollback: async () => {
        if (inTransaction && sqliteDb) {
          try {
            sqliteDb.exec('ROLLBACK');
          } catch (e) {
            // Ignore rollback error if already terminated
          } finally {
            inTransaction = false;
          }
        }
      },
      release: () => {
        if (inTransaction && sqliteDb) {
          try {
            sqliteDb.exec('ROLLBACK');
          } catch (e) {}
          inTransaction = false;
        }
      }
    };
  }
};

/**
 * Test Connection Helper
 */

async function addColumnIfMissing(conn, table, column, ddl) {
  try {
    const [r] = await conn.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
    if (r.length === 0) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
    }
  } catch (err) {}
}

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
    try {
      await conn.query('ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `token_version` INT NOT NULL DEFAULT 1;');
    } catch (migErr) {
      // Ignore if column exists
    }
    try {
      await conn.query('ALTER TABLE `admins` ADD COLUMN IF NOT EXISTS `token_version` INT NOT NULL DEFAULT 1;');
    } catch (migErr) {
      // Ignore if column exists
    }
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`student_whitelist\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`register_no\` VARCHAR(20) NOT NULL UNIQUE,
          \`dob\` VARCHAR(10) NOT NULL COMMENT 'Format: YYYY-MM-DD',
          \`claim_code_hash\` VARCHAR(100) NULL,
          \`is_claimed\` TINYINT(1) NOT NULL DEFAULT 0,
          \`claimed_student_id\` INT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_whitelist_reg_dob\` (\`register_no\`, \`dob\`),
          INDEX \`idx_whitelist_claimed\` (\`is_claimed\`),
          CONSTRAINT \`fk_whitelist_student\` FOREIGN KEY (\`claimed_student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (migErr) {
      // Ignore
    }
    await addColumnIfMissing(conn, 'student_whitelist', 'claim_code_hash', 'VARCHAR(100) NULL');
    await addColumnIfMissing(conn, 'student_whitelist', 'email', 'VARCHAR(100) NULL');
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`auth_lockouts\` (
          \`key_name\` VARCHAR(150) PRIMARY KEY,
          \`failures\` INT NOT NULL DEFAULT 0,
          \`first_attempt_ms\` BIGINT NOT NULL,
          \`locked_until_ms\` BIGINT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (migErr) {
      // Ignore
    }
    try {
      // Expand sensitive field lengths to store encrypted ciphertext (S10 fix)
      await conn.query('ALTER TABLE `students` MODIFY `aadhaar_no` VARCHAR(255) NULL, MODIFY `bank_acc_no` VARCHAR(255) NULL;');
    } catch (migErr) {
      // Ignore
    }
    await addColumnIfMissing(conn, 'students', 'must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');

    await addColumnIfMissing(conn, 'students', 'email_verified', 'TINYINT(1) NOT NULL DEFAULT 1');
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`email_verifications\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`student_id\` INT NOT NULL,
          \`email\` VARCHAR(100) NOT NULL,
          \`code_hash\` VARCHAR(100) NOT NULL,
          \`attempts\` INT NOT NULL DEFAULT 0,
          \`expires_at\` BIGINT NOT NULL,
          \`last_sent_at\` BIGINT NOT NULL,
          \`resend_count\` INT NOT NULL DEFAULT 0,
          \`resend_window_start\` BIGINT NOT NULL,
          UNIQUE KEY \`uq_ev_student\` (\`student_id\`),
          CONSTRAINT \`fk_ev_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (migErr) {
      // Ignore
    }
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`email_logs\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`student_id\` INT NULL,
          \`to_email\` VARCHAR(100) NULL,
          \`template\` VARCHAR(50) NOT NULL,
          \`status\` VARCHAR(10) NOT NULL COMMENT 'SENT | FAILED | SKIPPED',
          \`provider_message_id\` VARCHAR(100) NULL,
          \`error\` VARCHAR(255) NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX \`idx_el_student\` (\`student_id\`),
          INDEX \`idx_el_created\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (migErr) {
      // Ignore
    }


    // M8 fix: Preserves admin profile changes across boots

    
    try {
      const [idx] = await conn.query(
        "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'uq_student_doc'"
      );
      if (idx.length === 0) {
        await conn.query('ALTER TABLE `student_documents` ADD UNIQUE KEY `uq_student_doc` (`student_id`, `doc_type`);');
      }
    } catch (e) {}

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
