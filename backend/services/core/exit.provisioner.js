// backend/services/core/exit.provisioner.js
const { QueryTypes } = require('sequelize');

async function provisionExitTables(tenantDb) {
  try {
    // 1. Create exit_requests table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`exit_requests\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`resignation_date\` VARCHAR(20) NOT NULL,
        \`proposed_lwd\` VARCHAR(20) NOT NULL,
        \`approved_lwd\` VARCHAR(20) NULL,
        \`reason\` VARCHAR(255) NOT NULL,
        \`remarks\` TEXT NULL,
        \`status\` VARCHAR(50) DEFAULT 'Submitted',
        \`stage\` VARCHAR(50) DEFAULT 'Resignation',
        \`progress_percent\` INT DEFAULT 10,
        \`manager_remarks\` TEXT NULL,
        \`hr_remarks\` TEXT NULL,
        \`created_by\` VARCHAR(100) NULL,
        \`updated_by\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create notice_periods table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`notice_periods\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`notice_start_date\` VARCHAR(20) NOT NULL,
        \`original_lwd\` VARCHAR(20) NOT NULL,
        \`revised_lwd\` VARCHAR(20) NOT NULL,
        \`notice_days\` INT DEFAULT 0,
        \`completed_days\` INT DEFAULT 0,
        \`remaining_days\` INT DEFAULT 0,
        \`status\` VARCHAR(50) DEFAULT 'Active',
        \`early_release\` TINYINT(1) DEFAULT 0,
        \`notice_buyout\` TINYINT(1) DEFAULT 0,
        \`buyout_amount\` DECIMAL(12,2) DEFAULT 0.00,
        \`extension_days\` INT DEFAULT 0,
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create exit_clearances table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`exit_clearances\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`department\` VARCHAR(50) NOT NULL,
        \`clearance_type\` VARCHAR(100) NULL,
        \`assigned_to\` VARCHAR(100) NULL,
        \`status\` VARCHAR(50) DEFAULT 'Pending',
        \`due_date\` VARCHAR(20) NULL,
        \`remarks\` TEXT NULL,
        \`cleared_date\` TIMESTAMP NULL,
        \`rejection_reason\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create asset_returns table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`asset_returns\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`asset_id\` VARCHAR(50) NOT NULL,
        \`asset_name\` VARCHAR(200) NOT NULL,
        \`category\` VARCHAR(100) NULL,
        \`serial_number\` VARCHAR(100) NULL,
        \`assigned_date\` VARCHAR(20) NULL,
        \`condition_before\` VARCHAR(100) NULL,
        \`condition_after\` VARCHAR(100) NULL,
        \`return_date\` VARCHAR(20) NULL,
        \`status\` VARCHAR(50) DEFAULT 'Return Pending',
        \`remarks\` TEXT NULL,
        \`verified_at\` TIMESTAMP NULL,
        \`verified_by\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create no_dues table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`no_dues\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'Pending',
        \`cleared_date\` TIMESTAMP NULL,
        \`approved_by\` VARCHAR(100) NULL,
        \`remarks\` TEXT NULL,
        \`certificate_storage_key\` VARCHAR(500) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create fnf_settlements table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`fnf_settlements\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`last_working_date\` VARCHAR(20) NULL,
        \`settlement_date\` VARCHAR(20) NULL,
        \`salary_due\` DECIMAL(12,2) DEFAULT 0.00,
        \`leave_encashment\` DECIMAL(12,2) DEFAULT 0.00,
        \`bonus\` DECIMAL(12,2) DEFAULT 0.00,
        \`incentives\` DECIMAL(12,2) DEFAULT 0.00,
        \`reimbursements\` DECIMAL(12,2) DEFAULT 0.00,
        \`notice_recovery\` DECIMAL(12,2) DEFAULT 0.00,
        \`loan_recovery\` DECIMAL(12,2) DEFAULT 0.00,
        \`asset_recovery\` DECIMAL(12,2) DEFAULT 0.00,
        \`other_deductions\` DECIMAL(12,2) DEFAULT 0.00,
        \`gross_amount\` DECIMAL(12,2) DEFAULT 0.00,
        \`total_deductions\` DECIMAL(12,2) DEFAULT 0.00,
        \`net_payable\` DECIMAL(12,2) DEFAULT 0.00,
        \`status\` VARCHAR(50) DEFAULT 'Pending',
        \`payment_date\` VARCHAR(20) NULL,
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Create exit_interviews table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`exit_interviews\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`reason_for_leaving\` VARCHAR(255) NOT NULL,
        \`job_satisfaction\` INT DEFAULT 3,
        \`manager_feedback\` TEXT NULL,
        \`team_experience\` TEXT NULL,
        \`work_environment\` TEXT NULL,
        \`compensation_feedback\` TEXT NULL,
        \`career_growth\` TEXT NULL,
        \`learning_opportunities\` TEXT NULL,
        \`work_life_balance\` TEXT NULL,
        \`improvement_suggestions\` TEXT NULL,
        \`recommend_company\` VARCHAR(50) DEFAULT 'Maybe',
        \`rejoin_company\` VARCHAR(50) DEFAULT 'Maybe',
        \`additional_comments\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Create experience_letters table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`experience_letters\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`employee_id\` VARCHAR(50) NOT NULL,
        \`designation\` VARCHAR(100) NULL,
        \`department\` VARCHAR(100) NULL,
        \`joining_date\` VARCHAR(20) NULL,
        \`last_working_date\` VARCHAR(20) NULL,
        \`duration\` VARCHAR(100) NULL,
        \`status\` VARCHAR(50) DEFAULT 'Draft',
        \`storage_key\` VARCHAR(500) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Create exit_workflow_history table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`exit_workflow_history\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`exit_request_id\` CHAR(36) NOT NULL,
        \`stage\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL,
        \`updated_by\` VARCHAR(100) NULL,
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`exit_request_id\`) REFERENCES \`exit_requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

  } catch (err) {
    console.error('[Exit Provisioner] Failed to provision exit tables:', err);
    throw err;
  }
}

module.exports = { provisionExitTables };
