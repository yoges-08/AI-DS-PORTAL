-- ====================================================================
-- Migration: 003_email_automation.sql
-- Description: Adds email_verified flag, email_verifications table,
--              and email_logs audit ledger for automated email flows.
-- ====================================================================

-- 1. Add email_verified column to students (default 1 for backwards compatibility with existing students)
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `email_verified` TINYINT(1) NOT NULL DEFAULT 1;

-- 2. Create email_verifications table for 6-digit activation codes
CREATE TABLE IF NOT EXISTS `email_verifications` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`          INT NOT NULL,
  `email`               VARCHAR(100) NOT NULL,
  `code_hash`           VARCHAR(100) NOT NULL,
  `attempts`            INT NOT NULL DEFAULT 0,
  `expires_at`          BIGINT NOT NULL,
  `last_sent_at`        BIGINT NOT NULL,
  `resend_count`        INT NOT NULL DEFAULT 0,
  `resend_window_start` BIGINT NOT NULL,
  UNIQUE KEY `uq_ev_student` (`student_id`),
  CONSTRAINT `fk_ev_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create email_logs audit ledger table
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`          INT NULL,
  `to_email`            VARCHAR(100) NULL,
  `template`            VARCHAR(50) NOT NULL,
  `status`              VARCHAR(10) NOT NULL COMMENT 'SENT | FAILED | SKIPPED',
  `provider_message_id` VARCHAR(100) NULL,
  `error`               VARCHAR(255) NULL,
  `created_at`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_el_student` (`student_id`),
  INDEX `idx_el_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
