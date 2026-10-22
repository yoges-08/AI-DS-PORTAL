-- ====================================================================
-- Migration: 001_student_whitelist.sql
-- Description: Creates student_whitelist table, unique email index,
--              must_change_password column, and backfills existing students.
-- ====================================================================

-- 1. Create student_whitelist table
CREATE TABLE IF NOT EXISTS `student_whitelist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `register_no` VARCHAR(20) NOT NULL UNIQUE,
  `dob` VARCHAR(10) NOT NULL COMMENT 'Format: YYYY-MM-DD',
  `is_claimed` TINYINT(1) NOT NULL DEFAULT 0,
  `claimed_student_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_whitelist_reg_dob` (`register_no`, `dob`),
  INDEX `idx_whitelist_claimed` (`is_claimed`),
  CONSTRAINT `fk_whitelist_student` FOREIGN KEY (`claimed_student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add must_change_password column to students table if not exists
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `must_change_password` TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Safely normalize emails: convert empty strings to NULL so UNIQUE index won't collide on multiple blanks
UPDATE `students` SET `email` = NULL WHERE `email` IS NOT NULL AND (TRIM(`email`) = '' OR `email` = '');

-- 4. In case of existing duplicate emails, keep first student's email and set duplicates to NULL
UPDATE `students` s1
JOIN `students` s2 ON LOWER(s1.email) = LOWER(s2.email) AND s1.id > s2.id
SET s1.email = NULL
WHERE s1.email IS NOT NULL;

-- 5. Add unique index on email if not already present
-- (Note: MySQL permits multiple NULL values in a UNIQUE index)
SET @exist := (
  SELECT COUNT(*) FROM information_schema.statistics 
  WHERE table_schema = DATABASE() 
    AND table_name = 'students' 
    AND index_name = 'uq_students_email'
);
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `students` ADD UNIQUE INDEX `uq_students_email` (`email`)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Backfill existing registered students into student_whitelist as claimed
INSERT INTO `student_whitelist` (`register_no`, `dob`, `is_claimed`, `claimed_student_id`, `created_at`, `updated_at`)
SELECT `register_no`, `dob`, 1, `id`, NOW(), NOW()
FROM `students`
ON DUPLICATE KEY UPDATE 
  `dob` = VALUES(`dob`),
  `is_claimed` = 1,
  `claimed_student_id` = VALUES(`claimed_student_id`);
