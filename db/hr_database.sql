-- =========================================================================
-- Enterprise HRMS Multi-Tenant Database Schema Dump
-- Architected for Database-per-Tenant Isolation
-- Includes: system_master_db & tenant_db_schema Templates
-- =========================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =========================================================================
-- SECTION 1: MASTER PLATFORM DATABASE (`system_master_db`)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `system_master_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `system_master_db`;

-- Table structure for table `tenants`
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` CHAR(36) NOT NULL,
  `company_code` VARCHAR(50) NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `db_host` VARCHAR(255) NOT NULL,
  `db_port` INT NOT NULL DEFAULT 3306,
  `db_name` VARCHAR(100) NOT NULL,
  `db_username` VARCHAR(100) NOT NULL,
  `db_password` VARCHAR(255) NOT NULL, -- Stored encrypted at rest
  `db_ssl` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('Active', 'Suspended', 'Maintenance', 'Terminated') NOT NULL DEFAULT 'Active',
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenants_company_code` (`company_code`),
  INDEX `idx_tenants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `subscription_plans`
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `max_employees` INT NOT NULL DEFAULT 50,
  `max_storage_gb` INT NOT NULL DEFAULT 5,
  `features` JSON NULL,
  `price_monthly` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_plans_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `tenant_licenses`
CREATE TABLE IF NOT EXISTS `tenant_licenses` (
  `id` CHAR(36) NOT NULL,
  `tenant_id` CHAR(36) NOT NULL,
  `plan_id` CHAR(36) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('Active', 'Expired', 'Trial', 'GracePeriod') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`),
  INDEX `idx_licenses_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `system_settings`
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` CHAR(36) NOT NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `system_audit_logs`
CREATE TABLE IF NOT EXISTS `system_audit_logs` (
  `id` CHAR(36) NOT NULL,
  `actor_type` ENUM('System', 'SuperAdmin', 'TenantAdmin') NOT NULL,
  `actor_id` CHAR(36) NULL,
  `action` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `payload` JSON NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_logs_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================================
-- SECTION 2: TENANT SPECIFIC DATABASE TEMPLATE (`[company_code]_db`)
-- =========================================================================

-- NOTE: When provisioning a new tenant, dynamically execute the tables below 
-- inside the newly generated database schema (e.g. `nib01_db`).

CREATE DATABASE IF NOT EXISTS `tenant_template_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tenant_template_db`;

-- Table structure for table `roles`
CREATE TABLE IF NOT EXISTS `roles` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_roles_name` (`name`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `permissions`
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` CHAR(36) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_permissions_module_action` (`module`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `role_permissions`
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` CHAR(36) NOT NULL,
  `permission_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` CHAR(36) NOT NULL,
  `status` ENUM('Active', 'Inactive', 'Locked') NOT NULL DEFAULT 'Active',
  `last_login` TIMESTAMP NULL,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`, `deleted_at`),
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `branches`
CREATE TABLE IF NOT EXISTS `branches` (
  `id` CHAR(36) NOT NULL,
  `branch_code` VARCHAR(50) NOT NULL,
  `branch_name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `timezone` VARCHAR(100) NOT NULL DEFAULT 'UTC',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_branches_code` (`branch_code`, `deleted_at`),
  INDEX `idx_branches_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `departments`
CREATE TABLE IF NOT EXISTS `departments` (
  `id` CHAR(36) NOT NULL,
  `dept_code` VARCHAR(50) NOT NULL,
  `dept_name` VARCHAR(255) NOT NULL,
  `head_employee_id` CHAR(36) NULL,
  `parent_dept_id` CHAR(36) NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_depts_code` (`dept_code`, `deleted_at`),
  FOREIGN KEY (`parent_dept_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  INDEX `idx_depts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `designations`
CREATE TABLE IF NOT EXISTS `designations` (
  `id` CHAR(36) NOT NULL,
  `designation_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `department_id` CHAR(36) NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_designations_code` (`designation_code`, `deleted_at`),
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `shifts`
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `grace_time_minutes` INT NOT NULL DEFAULT 15,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `employees`
CREATE TABLE IF NOT EXISTS `employees` (
  `id` CHAR(36) NOT NULL,
  `employee_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `password` VARCHAR(255) NULL,
  `department` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Map self-referencing check constraint for department head
ALTER TABLE `departments` ADD CONSTRAINT `fk_departments_head` 
FOREIGN KEY (`head_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

-- Table structure for table `attendance`
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME NULL,
  `check_out` TIME NULL,
  `check_in_ip` VARCHAR(45) NULL,
  `check_out_ip` VARCHAR(45) NULL,
  `working_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Present', 'Absent', 'Late', 'HalfDay', 'OnLeave') NOT NULL DEFAULT 'Present',
  `overtime_minutes` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_attendance_emp_date` (`employee_id`, `date`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `leave_requests`
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `leave_type` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `total_days` DECIMAL(4,1) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `approved_by` CHAR(36) NULL,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `deleted_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  INDEX `idx_leaves_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `payroll`
CREATE TABLE IF NOT EXISTS `payroll` (
  `id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `pay_period_start` DATE NOT NULL,
  `pay_period_end` DATE NOT NULL,
  `basic_salary` DECIMAL(15,2) NOT NULL,
  `allowances` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `deductions` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_salary` DECIMAL(15,2) NOT NULL,
  `payment_status` ENUM('Draft', 'Processed', 'Paid', 'OnHold') NOT NULL DEFAULT 'Draft',
  `payment_date` DATE NULL,
  `payslip_url` VARCHAR(512) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  INDEX `idx_payroll_period` (`pay_period_start`, `pay_period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `audit_logs`
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `action` VARCHAR(255) NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `record_id` CHAR(36) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_tenant_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
