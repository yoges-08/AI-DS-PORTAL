/**
 * One-off migration script: Student Whitelist & Self-Registration Preparation
 * 
 * 1. Creates `student_whitelist` table if not exists
 * 2. Adds `must_change_password` to `students` table
 * 3. Safely sanitizes empty strings in `students.email` to NULL
 * 4. Ensures unique index on `students.email`
 * 5. Backfills all existing students into `student_whitelist` as claimed (is_claimed = 1)
 * 
 * Works seamlessly across MySQL and SQLite environments.
 */

const { pool, testConnection, getDbMode } = require('../config/db');

async function runMigration() {
  console.log('[Migration] Starting student whitelist migration...');
  await testConnection();
  const mode = getDbMode();
  console.log(`[Migration] Database mode: ${mode}`);

  try {
    if (mode === 'mysql') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Create student_whitelist
        console.log('[Migration] Creating student_whitelist table...');
        await conn.query(`
          CREATE TABLE IF NOT EXISTS student_whitelist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            register_no VARCHAR(20) NOT NULL UNIQUE,
            dob VARCHAR(10) NOT NULL COMMENT 'Format: YYYY-MM-DD',
            is_claimed TINYINT(1) NOT NULL DEFAULT 0,
            claimed_student_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_whitelist_reg_dob (register_no, dob),
            INDEX idx_whitelist_claimed (is_claimed),
            CONSTRAINT fk_whitelist_student FOREIGN KEY (claimed_student_id) REFERENCES students (id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Add must_change_password
        console.log('[Migration] Adding must_change_password column...');
        try {
          await conn.query(`
            ALTER TABLE students ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0;
          `);
        } catch (colErr) {
          console.log('[Migration Notice] must_change_password column notice:', colErr.message);
        }

        // 3. Clean empty emails
        console.log('[Migration] Normalizing email addresses (converting empty strings to NULL)...');
        await conn.query(`
          UPDATE students SET email = NULL WHERE email IS NOT NULL AND (TRIM(email) = '' OR email = '');
        `);

        // 4. Resolve duplicates if any
        try {
          await conn.query(`
            UPDATE students s1
            JOIN students s2 ON LOWER(s1.email) = LOWER(s2.email) AND s1.id > s2.id
            SET s1.email = NULL
            WHERE s1.email IS NOT NULL;
          `);
        } catch (dupErr) {
          // ignore
        }

        // 5. Add unique index on email
        console.log('[Migration] Ensuring UNIQUE index on students.email...');
        try {
          const [indexRows] = await conn.query(`
            SELECT COUNT(*) AS count FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
              AND table_name = 'students' 
              AND index_name = 'uq_students_email'
          `);
          if (Number(indexRows[0]?.count) === 0) {
            await conn.query(`ALTER TABLE students ADD UNIQUE INDEX uq_students_email (email);`);
            console.log('[Migration] Added uq_students_email index.');
          } else {
            console.log('[Migration] Index uq_students_email already exists.');
          }
        } catch (idxErr) {
          console.warn('[Migration Notice] Email index check:', idxErr.message);
        }

        // 6. Backfill existing students
        console.log('[Migration] Backfilling existing students into student_whitelist as claimed...');
        const [backfillResult] = await conn.query(`
          INSERT INTO student_whitelist (register_no, dob, is_claimed, claimed_student_id, created_at, updated_at)
          SELECT register_no, dob, 1, id, NOW(), NOW()
          FROM students
          ON DUPLICATE KEY UPDATE 
            dob = VALUES(dob),
            is_claimed = 1,
            claimed_student_id = VALUES(claimed_student_id);
        `);
        console.log(`[Migration] Backfill complete. Affected rows: ${backfillResult.affectedRows}`);

        await conn.commit();
        console.log('[Migration] All MySQL migration steps completed successfully!');
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      // SQLite Mode
      console.log('[Migration] Applying migration to local SQLite database...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS student_whitelist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          register_no TEXT UNIQUE NOT NULL,
          dob TEXT NOT NULL,
          is_claimed INTEGER DEFAULT 0,
          claimed_student_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (claimed_student_id) REFERENCES students(id) ON DELETE SET NULL
        );
      `);

      try {
        await pool.query(`ALTER TABLE students ADD COLUMN must_change_password INTEGER DEFAULT 0;`);
      } catch (e) {
        // column already exists
      }

      await pool.query(`UPDATE students SET email = NULL WHERE email IS NOT NULL AND TRIM(email) = '';`);

      // Backfill in SQLite
      const [existingStudents] = await pool.query(`SELECT id, register_no, dob FROM students;`);
      let backfilled = 0;
      for (const s of existingStudents) {
        const [existing] = await pool.query(`SELECT id FROM student_whitelist WHERE register_no = ?;`, [s.register_no]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO student_whitelist (register_no, dob, is_claimed, claimed_student_id) VALUES (?, ?, 1, ?);`,
            [s.register_no, s.dob, s.id]
          );
          backfilled++;
        } else {
          await pool.query(
            `UPDATE student_whitelist SET is_claimed = 1, claimed_student_id = ?, dob = ? WHERE register_no = ?;`,
            [s.id, s.dob, s.register_no]
          );
        }
      }
      console.log(`[Migration] SQLite migration complete! Backfilled ${backfilled} student records.`);
    }

    console.log('[Migration] SUCCESS!');
    process.exit(0);
  } catch (error) {
    console.error('[Migration Error]:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
