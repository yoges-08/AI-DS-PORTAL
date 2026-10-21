-- ====================================================================
-- Department Student Information System (AI & DS Department)
-- Database: aids_portal
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `aids_portal` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `aids_portal`;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `department` VARCHAR(100) NOT NULL DEFAULT 'Artificial Intelligence & Data Science',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `register_no` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `dob` VARCHAR(10) NOT NULL COMMENT 'Format: YYYY-MM-DD',
  `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hash of DDMMYYYY',
  `year` INT NULL,
  `section` VARCHAR(5) NULL,
  
  -- Step 1: Personal Details
  `gender` VARCHAR(20) NULL,
  `blood_group` VARCHAR(10) NULL,
  `religion` VARCHAR(50) NULL,
  `community` VARCHAR(20) NULL,
  `caste` VARCHAR(100) NULL,
  `nationality` VARCHAR(50) DEFAULT 'Indian',
  `aadhaar_no` VARCHAR(12) NULL,
  `mother_tongue` VARCHAR(50) NULL,
  `photo_path` VARCHAR(255) NULL,
  `photo_data` LONGBLOB NULL,

  -- Step 2: Contact Details
  `mobile` VARCHAR(15) NULL,
  `alt_mobile` VARCHAR(15) NULL,
  `email` VARCHAR(100) NULL,
  `permanent_address` TEXT NULL,
  `communication_address` TEXT NULL,
  `is_same_address` TINYINT(1) DEFAULT 0,
  `district` VARCHAR(100) NULL,
  `state` VARCHAR(100) DEFAULT 'Tamil Nadu',
  `pincode` VARCHAR(10) NULL,

  -- Step 3: Family Details
  `father_name` VARCHAR(100) NULL,
  `mother_name` VARCHAR(100) NULL,
  `guardian_name` VARCHAR(100) NULL,
  `parents_occupation` VARCHAR(100) NULL,
  `parents_mobile` VARCHAR(15) NULL,
  `annual_income` DECIMAL(12, 2) NULL,

  -- Step 4: Academic Details
  `sslc_school` VARCHAR(150) NULL,
  `sslc_board` VARCHAR(100) NULL,
  `sslc_year` INT NULL,
  `sslc_percentage` DECIMAL(5, 2) NULL,
  `hsc_school` VARCHAR(150) NULL,
  `hsc_board` VARCHAR(100) NULL,
  `hsc_year` INT NULL,
  `hsc_percentage` DECIMAL(5, 2) NULL,
  `current_semester` INT DEFAULT 1,
  `mode_of_admission` VARCHAR(50) NULL,

  -- Step 5: Scholarship and Category Details
  `is_first_graduate` TINYINT(1) DEFAULT 0,
  `is_pms` TINYINT(1) DEFAULT 0,
  `pms_application_no` VARCHAR(50) NULL,
  `pms_status` VARCHAR(50) DEFAULT 'N/A',
  `other_scholarship_name` VARCHAR(100) NULL,
  `other_scholarship_amount` DECIMAL(10, 2) NULL,
  `other_scholarship_status` VARCHAR(50) NULL,
  `community_cert_no` VARCHAR(50) NULL,
  `community_cert_issuer` VARCHAR(100) NULL,
  `community_cert_date` DATE NULL,
  `income_cert_no` VARCHAR(50) NULL,
  `income_cert_issuer` VARCHAR(100) NULL,
  `income_cert_date` DATE NULL,

  -- Step 6: Bank Details
  `bank_acc_holder` VARCHAR(100) NULL,
  `bank_name` VARCHAR(100) NULL,
  `bank_acc_no` VARCHAR(30) NULL,
  `bank_ifsc` VARCHAR(15) NULL,
  `bank_branch` VARCHAR(100) NULL,

  -- Status & Lock Workflow
  `status` ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED') DEFAULT 'DRAFT',
  `is_locked` TINYINT(1) DEFAULT 0,
  `locked_at` TIMESTAMP NULL,
  `locked_by` VARCHAR(50) NULL,
  `submission_date` TIMESTAMP NULL,
  `rejection_reason` TEXT NULL,
  `declaration_accepted` TINYINT(1) DEFAULT 0,

  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reg_no` (`register_no`),
  INDEX `idx_year_sec` (`year`, `section`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Student Documents Table
CREATE TABLE IF NOT EXISTS `student_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `doc_type` VARCHAR(50) NOT NULL COMMENT 'photo, aadhaar, community_cert, income_cert, first_graduate_cert, bank_passbook, marksheets',
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(50) NOT NULL,
  `file_data` LONGBLOB NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_docs_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NULL,
  `admin_username` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `student_id` INT NULL,
  `student_reg_no` VARCHAR(50) NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
