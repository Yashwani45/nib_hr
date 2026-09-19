// backend/controllers/core/table.controller.js
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/apiError');
const { QueryTypes } = require('sequelize');

const provisionEmployeeTables = async (tenantDb) => {
  try {
    const targetColumnsList = [
      // Hero Card & Basic Identity
      "employeeName VARCHAR(255) NULL",
      "email VARCHAR(255) NULL",
      "company VARCHAR(255) NULL",
      "department VARCHAR(255) NULL",
      "designation VARCHAR(255) NULL",
      "photo TEXT NULL",
      "employeeId VARCHAR(255) NULL",
      "employeeCode VARCHAR(255) NULL",
      "employeeStatus VARCHAR(255) NULL DEFAULT 'Active'",
      "profile_data LONGTEXT NULL",
      "userId VARCHAR(255) NULL",

      // Card 1: Basic Information
      "firstName VARCHAR(255) NULL",
      "middleName VARCHAR(255) NULL",
      "lastName VARCHAR(255) NULL",
      "gender VARCHAR(50) NULL",
      "dateOfBirth DATE NULL",
      "maritalStatus VARCHAR(255) NULL",
      "bloodGroup VARCHAR(255) NULL",
      "nationality VARCHAR(255) NULL",

      // Card 2: Official Information
      "officialEmail VARCHAR(255) NULL",
      "dateOfJoining DATE NULL",
      "reportingManager VARCHAR(255) NULL",
      "employeeType VARCHAR(255) NULL",
      "shift VARCHAR(255) NULL",
      "weeklyOff VARCHAR(255) NULL",

      // Card 3: Contact Information
      "mobileNumber VARCHAR(255) NULL",
      "alternateMobile VARCHAR(255) NULL",
      "personalEmail VARCHAR(255) NULL",
      "currentAddress TEXT NULL",
      "permanentAddress TEXT NULL",

      // Card 4: Education & Experience
      "highestDegree VARCHAR(255) NULL",
      "specialization VARCHAR(255) NULL",
      "university VARCHAR(255) NULL",
      "prevCompany VARCHAR(255) NULL",
      "prevDesignation VARCHAR(255) NULL"
    ];

    const UI_COLUMNS_SET = new Set([
      'id', 'employee_name', 'employeename', 'employeecode', 'emp_code',
      'employeeid', 'photo', 'firstname', 'middlename', 'lastname',
      'gender', 'dateofbirth', 'maritalstatus', 'bloodgroup', 'nationality',
      'company', 'department', 'designation', 'dateofjoining',
      'reportingmanager', 'employeetype', 'employeestatus', 'shift',
      'weeklyoff', 'officialemail', 'personalemail', 'email',
      'mobilenumber', 'alternatemobile', 'currentaddress', 'permanentaddress',
      'highestdegree', 'specialization', 'university', 'prevcompany',
      'prevdesignation', 'profile_data', 'user_id', 'userid',
      'created_at', 'updated_at'
    ]);

    for (const targetTbl of ['employees', 'employee_profile']) {
      let colResults = [];
      try {
        colResults = await tenantDb.query(
          `SHOW COLUMNS FROM \`${targetTbl}\``,
          { type: QueryTypes.SELECT }
        );
      } catch (e) {
        continue;
      }

      const existingCols = colResults.map(c => c.Field.toLowerCase());

      await tenantDb.query(`ALTER TABLE \`${targetTbl}\` MODIFY COLUMN \`created_at\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
      await tenantDb.query(`ALTER TABLE \`${targetTbl}\` MODIFY COLUMN \`updated_at\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).catch(() => {});

      for (const colDef of targetColumnsList) {
        const colName = colDef.split(' ')[0];
        if (!existingCols.includes(colName.toLowerCase())) {
          await tenantDb.query(`ALTER TABLE \`${targetTbl}\` ADD COLUMN \`${colName}\` ${colDef.substring(colName.length)}`).catch(() => {});
        }
      }

      // Drop any extra columns that are not in the UI
      for (const col of colResults) {
        if (!UI_COLUMNS_SET.has(col.Field.toLowerCase())) {
          await tenantDb.query(`ALTER TABLE \`${targetTbl}\` DROP COLUMN \`${col.Field}\``).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[table.controller] provisionEmployeeTables notice:', err.message);
  }
};

const provisionPayrollTables = async (tenantDb) => {
  try {
    const targetColumnsList = [
      "payrollId VARCHAR(255) NULL",
      "payrollMonth VARCHAR(255) NULL",
      "payrollYear VARCHAR(255) NULL",
      "company VARCHAR(255) NULL",
      "branch VARCHAR(255) NULL",
      "department VARCHAR(255) NULL",
      "employee VARCHAR(255) NULL",
      "employeeCode VARCHAR(255) NULL",
      "payrollType VARCHAR(255) NULL",
      "salaryStructure VARCHAR(255) NULL",
      "workingDays INT NULL",
      "presentDays INT NULL",
      "absentDays INT NULL",
      "paidLeave INT NULL",
      "lopDays INT NULL",
      "overtimeHours DECIMAL(12,2) NULL",
      "grossSalary DECIMAL(12,2) NULL",
      "totalAllowances DECIMAL(12,2) NULL",
      "totalDeductions DECIMAL(12,2) NULL",
      "bonus DECIMAL(12,2) NULL",
      "incentive DECIMAL(12,2) NULL",
      "taxDeduction DECIMAL(12,2) NULL",
      "pfDeduction DECIMAL(12,2) NULL",
      "esiDeduction DECIMAL(12,2) NULL",
      "professionalTax DECIMAL(12,2) NULL",
      "loanDeduction DECIMAL(12,2) NULL",
      "advanceDeduction DECIMAL(12,2) NULL",
      "netSalary DECIMAL(12,2) NULL",
      "payrollStatus VARCHAR(255) NULL",
      "paymentStatus VARCHAR(255) NULL",
      "paymentDate DATE NULL",
      "remarks TEXT NULL",
      "approvedBy VARCHAR(255) NULL",
      "approvedDate DATE NULL",
      "is_active VARCHAR(50) NULL"
    ];

    const targetTbl = 'payroll_process';
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`${targetTbl}\` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Fetch column metadata to perform diff alter
    let validColumns = [];
    try {
      const colResults = await tenantDb.query(
        `SHOW COLUMNS FROM \`${targetTbl}\``,
        { type: QueryTypes.SELECT }
      );
      validColumns = colResults.map(c => c.Field);
    } catch (e) {
      validColumns = [];
    }

    // Alter table schemas dynamically if any columns are missing
    for (const colDef of targetColumnsList) {
      const colName = colDef.split(' ')[0];
      if (validColumns.length > 0 && !validColumns.includes(colName)) {
        await tenantDb.query(`ALTER TABLE \`${targetTbl}\` ADD COLUMN \`${colName}\` ${colDef.substring(colName.length)}`).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[Payroll Table Provisioner Failed]:', err.message);
  }
};

const provisionRecruitmentTables = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');

    // 1. job_postings table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`job_postings\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(255) NULL,
        \`department\` VARCHAR(255) NULL,
        \`location\` VARCHAR(255) NULL,
        \`type\` VARCHAR(255) NULL,
        \`experience\` VARCHAR(255) NULL,
        \`description\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // 2. interviews table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`interviews\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`candidate_name\` VARCHAR(255) NULL,
        \`candidate_email\` VARCHAR(255) NULL,
        \`job_title\` VARCHAR(255) NULL,
        \`interview_round\` VARCHAR(255) NULL,
        \`date_time\` VARCHAR(255) NULL,
        \`interviewer\` VARCHAR(255) NULL,
        \`score\` INT NULL DEFAULT 0,
        \`status\` VARCHAR(255) NULL DEFAULT 'Scheduled',
        \`feedback\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // 3. offer_letters table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`offer_letters\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`candidate_name\` VARCHAR(255) NULL,
        \`candidate_email\` VARCHAR(255) NULL,
        \`job_title\` VARCHAR(255) NULL,
        \`ctc\` VARCHAR(255) NULL,
        \`offer_date\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Sent',
        \`joining_date\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // 4. onboarding_tasks table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`onboarding_tasks\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`candidate_name\` VARCHAR(255) NULL,
        \`candidate_email\` VARCHAR(255) NULL,
        \`job_title\` VARCHAR(255) NULL,
        \`tasks\` TEXT NULL,
        \`progress\` INT NULL DEFAULT 0,
        \`status\` VARCHAR(255) NULL DEFAULT 'Pending',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // 5. joining_records table
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`joining_records\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`candidate_name\` VARCHAR(255) NULL,
        \`candidate_email\` VARCHAR(255) NULL,
        \`job_title\` VARCHAR(255) NULL,
        \`joining_date\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Verified',
        \`employee_code\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

  } catch (err) {
    console.error('[Recruitment Table Provisioner Failed]:', err.message);
  }
};

const provisionLeaveTables = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');

    // 1. Create or alter leave_requests to ensure VARCHAR employeeId/employee_id, halfDay, attachment, rejectionReason, approved_by, approval_date columns exist
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`reqId\` VARCHAR(255) NULL,
        \`empName\` VARCHAR(255) NULL,
        \`employeeId\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`leaveType\` VARCHAR(255) NULL,
        \`fromDate\` VARCHAR(255) NULL,
        \`toDate\` VARCHAR(255) NULL,
        \`totalDays\` DECIMAL(4,1) NULL DEFAULT 1.0,
        \`halfDay\` VARCHAR(50) NULL DEFAULT 'Full Day',
        \`attachment\` TEXT NULL,
        \`reason\` TEXT NULL,
        \`rejectionReason\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'PENDING',
        \`approved_by\` VARCHAR(255) NULL,
        \`approval_date\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`ALTER TABLE \`leave_requests\` MODIFY COLUMN \`employeeId\` VARCHAR(255) NULL`).catch(() => {});
    await tenantDb.query("ALTER TABLE `leave_requests` MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
    await tenantDb.query("ALTER TABLE `leave_requests` MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

    const lrCols = (await tenantDb.query("SHOW COLUMNS FROM `leave_requests`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!lrCols.includes('employee_id')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `employee_id` VARCHAR(255) NULL").catch(() => {});
    }
    if (!lrCols.includes('halfday')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `halfDay` VARCHAR(50) NULL DEFAULT 'Full Day'").catch(() => {});
    }
    if (!lrCols.includes('attachment')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `attachment` TEXT NULL").catch(() => {});
    }
    if (!lrCols.includes('rejectionreason')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `rejectionReason` TEXT NULL").catch(() => {});
    }
    if (!lrCols.includes('approved_by')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `approved_by` VARCHAR(255) NULL").catch(() => {});
    }
    if (!lrCols.includes('approval_date')) {
      await tenantDb.query("ALTER TABLE `leave_requests` ADD COLUMN `approval_date` VARCHAR(255) NULL").catch(() => {});
    }

    // 2. Create or alter holidays
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`holidays\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`holiday_name\` VARCHAR(255) NULL,
        \`holiday_date\` DATE NULL,
        \`holiday_type\` VARCHAR(255) NULL,
        \`branch\` VARCHAR(255) NULL,
        \`location\` VARCHAR(255) NULL,
        \`company\` VARCHAR(255) NULL,
        \`employee_applicability\` TEXT NULL,
        \`description\` TEXT NULL,
        \`is_working_day\` TINYINT(1) DEFAULT 0,
        \`status\` VARCHAR(255) DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    const hCols = (await tenantDb.query("SHOW COLUMNS FROM `holidays`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    
    // Ensure created_at and updated_at have proper default values
    await tenantDb.query("ALTER TABLE `holidays` MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
    await tenantDb.query("ALTER TABLE `holidays` MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

    if (!hCols.includes('location')) {
      await tenantDb.query("ALTER TABLE `holidays` ADD COLUMN `location` VARCHAR(255) NULL").catch(() => {});
    }
    if (!hCols.includes('company')) {
      await tenantDb.query("ALTER TABLE `holidays` ADD COLUMN `company` VARCHAR(255) NULL").catch(() => {});
    }
    if (!hCols.includes('employee_applicability')) {
      await tenantDb.query("ALTER TABLE `holidays` ADD COLUMN `employee_applicability` TEXT NULL").catch(() => {});
    }
    if (!hCols.includes('is_working_day')) {
      await tenantDb.query("ALTER TABLE `holidays` ADD COLUMN `is_working_day` TINYINT(1) DEFAULT 0").catch(() => {});
    }

    // 3. Create leave_transactions
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`leave_transactions\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`leave_type\` VARCHAR(255) NULL,
        \`transaction_type\` VARCHAR(50) NULL,
        \`days\` DECIMAL(4,1) NULL,
        \`description\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});
    // 4. Ensure designations columns exist
    const desigCols = (await tenantDb.query("SHOW COLUMNS FROM `designations`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!desigCols.includes('min_experience')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `min_experience` VARCHAR(50) NULL").catch(() => {});
    }
    if (!desigCols.includes('max_experience')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `max_experience` VARCHAR(50) NULL").catch(() => {});
    }
    if (!desigCols.includes('job_category')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `job_category` VARCHAR(100) NULL").catch(() => {});
    }
    if (!desigCols.includes('employment_type')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `employment_type` VARCHAR(100) NULL").catch(() => {});
    }

    // 5. Ensure employees.designation_id exists
    const empCols = (await tenantDb.query("SHOW COLUMNS FROM `employees`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!empCols.includes('designation_id')) {
      await tenantDb.query("ALTER TABLE `employees` ADD COLUMN `designation_id` VARCHAR(50) NULL").catch(() => {});
    }

  } catch (err) {
    console.warn('[table.controller] provisionLeaveTables notice:', err.message);
  }
};

const provisionPerformanceTables = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');

    let pmCols = (await tenantDb.query("SHOW COLUMNS FROM `performance_masters`", { type: QueryTypes.SELECT }).catch(() => [])).map(c => c.Field.toLowerCase());
    if (pmCols.length > 0) {
      if (!pmCols.includes('company')) {
        await tenantDb.query("ALTER TABLE `performance_masters` ADD COLUMN `company` TEXT NULL").catch(() => {});
      }
      if (!pmCols.includes('branch')) {
        await tenantDb.query("ALTER TABLE `performance_masters` ADD COLUMN `branch` TEXT NULL").catch(() => {});
      }
      if (!pmCols.includes('applicable_employees')) {
        await tenantDb.query("ALTER TABLE `performance_masters` ADD COLUMN `applicable_employees` TEXT NULL").catch(() => {});
      }
      if (!pmCols.includes('assigned_reviewers')) {
        await tenantDb.query("ALTER TABLE `performance_masters` ADD COLUMN `assigned_reviewers` TEXT NULL").catch(() => {});
      }
    }

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_goals\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`cycle_id\` VARCHAR(255) NULL,
        \`goal_name\` VARCHAR(255) NULL,
        \`description\` TEXT NULL,
        \`category\` VARCHAR(255) NULL DEFAULT 'SMART',
        \`target_value\` VARCHAR(255) NULL,
        \`current_value\` VARCHAR(255) NULL DEFAULT '0',
        \`weightage\` INT NULL DEFAULT 0,
        \`due_date\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Assigned',
        \`achievements\` TEXT NULL,
        \`self_comment\` TEXT NULL,
        \`manager_comment\` TEXT NULL,
        \`attachment_url\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_appraisals\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`cycle_id\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Draft',
        \`self_rating\` DECIMAL(4,2) NULL,
        \`self_comments\` TEXT NULL,
        \`manager_rating\` DECIMAL(4,2) NULL,
        \`manager_comments\` TEXT NULL,
        \`hr_rating\` DECIMAL(4,2) NULL,
        \`hr_comments\` TEXT NULL,
        \`final_rating\` VARCHAR(255) NULL,
        \`final_score\` DECIMAL(5,2) NULL,
        \`competency_ratings\` TEXT NULL,
        \`strengths\` TEXT NULL,
        \`weaknesses\` TEXT NULL,
        \`improvement_areas\` TEXT NULL,
        \`recommended_training\` TEXT NULL,
        \`acknowledgement_date\` VARCHAR(255) NULL,
        \`employee_signature\` VARCHAR(255) NULL,
        \`is_calibrated\` TINYINT(1) DEFAULT 0,
        \`calibration_comments\` TEXT NULL,
        \`competency_category\` VARCHAR(255) NULL,
        \`competency_name\` VARCHAR(255) NULL,
        \`competency_description\` TEXT NULL,
        \`required_level\` VARCHAR(255) NULL,
        \`current_level\` VARCHAR(255) NULL,
        \`target_level\` VARCHAR(255) NULL,
        \`rating\` DECIMAL(4,2) NULL,
        \`weightage\` INT NULL,
        \`evidence\` TEXT NULL,
        \`development_required\` VARCHAR(10) NULL,
        \`training_recommended\` TEXT NULL,
        \`evaluated_by\` VARCHAR(255) NULL,
        \`evaluation_date\` VARCHAR(255) NULL,
        \`remarks\` TEXT NULL,
        \`skill_gap\` TEXT NULL,
        \`current_skill_level\` VARCHAR(255) NULL,
        \`required_skill_level\` VARCHAR(255) NULL,
        \`development_objective\` TEXT NULL,
        \`development_action\` TEXT NULL,
        \`recommended_course\` VARCHAR(255) NULL,
        \`training_program\` VARCHAR(255) NULL,
        \`certification\` VARCHAR(255) NULL,
        \`mentor_coach\` VARCHAR(255) NULL,
        \`start_date\` VARCHAR(255) NULL,
        \`target_completion_date\` VARCHAR(255) NULL,
        \`priority\` VARCHAR(50) NULL,
        \`progress\` INT NULL,
        \`success_criteria\` TEXT NULL,
        \`completion_date\` VARCHAR(255) NULL,
        \`appraisal_id\` VARCHAR(255) NULL,
        \`feedback_provider_id\` VARCHAR(255) NULL,
        \`relationship\` VARCHAR(255) NULL,
        \`ratings\` TEXT NULL,
        \`comments\` TEXT NULL,
        \`is_anonymous\` TINYINT(1) DEFAULT 0,
        \`goal_name\` VARCHAR(255) NULL,
        \`description\` TEXT NULL,
        \`category\` VARCHAR(255) NULL,
        \`target_value\` VARCHAR(255) NULL,
        \`current_value\` VARCHAR(255) NULL,
        \`achievements\` TEXT NULL,
        \`self_comment\` TEXT NULL,
        \`manager_comment\` TEXT NULL,
        \`attachment_url\` TEXT NULL,
        \`cycle_name\` VARCHAR(255) NULL,
        \`review_period\` VARCHAR(255) NULL,
        \`end_date\` VARCHAR(255) NULL,
        \`department\` VARCHAR(255) NULL,
        \`designation\` VARCHAR(255) NULL,
        \`rating_scale\` VARCHAR(255) NULL,
        \`self_review_weight\` INT NULL,
        \`manager_review_weight\` INT NULL,
        \`deleted_at\` DATETIME NULL,
        \`company\` TEXT NULL,
        \`branch\` TEXT NULL,
        \`applicable_employees\` TEXT NULL,
        \`assigned_reviewers\` TEXT NULL,
        \`manager_id\` VARCHAR(255) NULL,
        \`reason\` TEXT NULL,
        \`performance_gaps\` TEXT NULL,
        \`expected_targets\` TEXT NULL,
        \`action_plan\` TEXT NULL,
        \`support_required\` TEXT NULL,
        \`review_frequency\` VARCHAR(255) NULL,
        \`milestones\` TEXT NULL,
        \`final_outcome\` TEXT NULL,
        \`rating_code\` VARCHAR(255) NULL,
        \`rating_name\` VARCHAR(255) NULL,
        \`numeric_score\` DECIMAL(4,2) NULL,
        \`min_score\` DECIMAL(4,2) NULL,
        \`max_score\` DECIMAL(4,2) NULL,
        \`applicable_company\` VARCHAR(255) NULL,
        \`recommendation_type\` VARCHAR(255) NULL,
        \`details\` TEXT NULL,
        \`proposed_salary\` DECIMAL(12,2) NULL,
        \`proposed_designation\` VARCHAR(255) NULL,
        \`approved_by\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    let perfCols = [];
    try {
      const colResults = await tenantDb.query(
        `SHOW COLUMNS FROM \`performance_appraisals\``,
        { type: QueryTypes.SELECT }
      );
      perfCols = colResults.map(c => c.Field);
    } catch (e) {
      perfCols = [];
    }

    const requiredPerfCols = [
      { name: 'competency_category', def: 'VARCHAR(255) NULL' },
      { name: 'competency_name', def: 'VARCHAR(255) NULL' },
      { name: 'competency_description', def: 'TEXT NULL' },
      { name: 'required_level', def: 'VARCHAR(255) NULL' },
      { name: 'current_level', def: 'VARCHAR(255) NULL' },
      { name: 'target_level', def: 'VARCHAR(255) NULL' },
      { name: 'rating', def: 'DECIMAL(4,2) NULL' },
      { name: 'weightage', def: 'INT NULL' },
      { name: 'evidence', def: 'TEXT NULL' },
      { name: 'development_required', def: 'VARCHAR(10) NULL' },
      { name: 'training_recommended', def: 'TEXT NULL' },
      { name: 'evaluated_by', def: 'VARCHAR(255) NULL' },
      { name: 'evaluation_date', def: 'VARCHAR(255) NULL' },
      { name: 'remarks', def: 'TEXT NULL' },
      { name: 'skill_gap', def: 'TEXT NULL' },
      { name: 'current_skill_level', def: 'VARCHAR(255) NULL' },
      { name: 'required_skill_level', def: 'VARCHAR(255) NULL' },
      { name: 'development_objective', def: 'TEXT NULL' },
      { name: 'development_action', def: 'TEXT NULL' },
      { name: 'recommended_course', def: 'VARCHAR(255) NULL' },
      { name: 'training_program', def: 'VARCHAR(255) NULL' },
      { name: 'certification', def: 'VARCHAR(255) NULL' },
      { name: 'mentor_coach', def: 'VARCHAR(255) NULL' },
      { name: 'start_date', def: 'VARCHAR(255) NULL' },
      { name: 'target_completion_date', def: 'VARCHAR(255) NULL' },
      { name: 'priority', def: 'VARCHAR(50) NULL' },
      { name: 'progress', def: 'INT NULL' },
      { name: 'success_criteria', def: 'TEXT NULL' },
      { name: 'completion_date', def: 'VARCHAR(255) NULL' },
      { name: 'appraisal_id', def: 'VARCHAR(255) NULL' },
      { name: 'feedback_provider_id', def: 'VARCHAR(255) NULL' },
      { name: 'relationship', def: 'VARCHAR(255) NULL' },
      { name: 'ratings', def: 'TEXT NULL' },
      { name: 'comments', def: 'TEXT NULL' },
      { name: 'is_anonymous', def: 'TINYINT(1) DEFAULT 0' },
      { name: 'goal_name', def: 'VARCHAR(255) NULL' },
      { name: 'description', def: 'TEXT NULL' },
      { name: 'category', def: 'VARCHAR(255) NULL' },
      { name: 'target_value', def: 'VARCHAR(255) NULL' },
      { name: 'current_value', def: 'VARCHAR(255) NULL' },
      { name: 'achievements', def: 'TEXT NULL' },
      { name: 'self_comment', def: 'TEXT NULL' },
      { name: 'manager_comment', def: 'TEXT NULL' },
      { name: 'attachment_url', def: 'TEXT NULL' },
      { name: 'cycle_name', def: 'VARCHAR(255) NULL' },
      { name: 'review_period', def: 'VARCHAR(255) NULL' },
      { name: 'end_date', def: 'VARCHAR(255) NULL' },
      { name: 'department', def: 'VARCHAR(255) NULL' },
      { name: 'designation', def: 'VARCHAR(255) NULL' },
      { name: 'rating_scale', def: 'VARCHAR(255) NULL' },
      { name: 'self_review_weight', def: 'INT NULL' },
      { name: 'manager_review_weight', def: 'INT NULL' },
      { name: 'deleted_at', def: 'DATETIME NULL' },
      { name: 'company', def: 'TEXT NULL' },
      { name: 'branch', def: 'TEXT NULL' },
      { name: 'applicable_employees', def: 'TEXT NULL' },
      { name: 'assigned_reviewers', def: 'TEXT NULL' },
      { name: 'manager_id', def: 'VARCHAR(255) NULL' },
      { name: 'reason', def: 'TEXT NULL' },
      { name: 'performance_gaps', def: 'TEXT NULL' },
      { name: 'expected_targets', def: 'TEXT NULL' },
      { name: 'action_plan', def: 'TEXT NULL' },
      { name: 'support_required', def: 'TEXT NULL' },
      { name: 'review_frequency', def: 'VARCHAR(255) NULL' },
      { name: 'milestones', def: 'TEXT NULL' },
      { name: 'final_outcome', def: 'TEXT NULL' },
      { name: 'rating_code', def: 'VARCHAR(255) NULL' },
      { name: 'rating_name', def: 'VARCHAR(255) NULL' },
      { name: 'numeric_score', def: 'DECIMAL(4,2) NULL' },
      { name: 'min_score', def: 'DECIMAL(4,2) NULL' },
      { name: 'max_score', def: 'DECIMAL(4,2) NULL' },
      { name: 'applicable_company', def: 'VARCHAR(255) NULL' },
      { name: 'recommendation_type', def: 'VARCHAR(255) NULL' },
      { name: 'details', def: 'TEXT NULL' },
      { name: 'proposed_salary', def: 'DECIMAL(12,2) NULL' },
      { name: 'proposed_designation', def: 'VARCHAR(255) NULL' },
      { name: 'approved_by', def: 'VARCHAR(255) NULL' }
    ];

    for (const col of requiredPerfCols) {
      if (!perfCols.includes(col.name)) {
        await tenantDb.query(`ALTER TABLE \`performance_appraisals\` ADD COLUMN \`${col.name}\` ${col.def}`).catch(() => {});
      }
    }

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_feedback_360\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`appraisal_id\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`feedback_provider_id\` VARCHAR(255) NULL,
        \`relationship\` VARCHAR(255) NULL,
        \`ratings\` TEXT NULL,
        \`comments\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Pending',
        \`is_anonymous\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_pips\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`manager_id\` VARCHAR(255) NULL,
        \`reason\` TEXT NULL,
        \`performance_gaps\` TEXT NULL,
        \`expected_targets\` TEXT NULL,
        \`action_plan\` TEXT NULL,
        \`support_required\` TEXT NULL,
        \`start_date\` VARCHAR(255) NULL,
        \`end_date\` VARCHAR(255) NULL,
        \`review_frequency\` VARCHAR(255) NULL DEFAULT 'Weekly',
        \`milestones\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`final_outcome\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_recommendations\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`cycle_id\` VARCHAR(255) NULL,
        \`recommendation_type\` VARCHAR(255) NULL,
        \`details\` TEXT NULL,
        \`proposed_salary\` DECIMAL(12,2) NULL,
        \`proposed_designation\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Pending',
        \`approved_by\` VARCHAR(255) NULL,
        \`comments\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_ratings\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`rating_code\` VARCHAR(255) NULL,
        \`rating_name\` VARCHAR(255) NULL,
        \`numeric_score\` DECIMAL(4,2) NULL,
        \`min_score\` DECIMAL(4,2) NULL,
        \`max_score\` DECIMAL(4,2) NULL,
        \`description\` TEXT NULL,
        \`applicable_company\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_competencies\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`cycle_id\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`competency_category\` VARCHAR(255) NULL,
        \`competency_name\` VARCHAR(255) NULL,
        \`competency_description\` TEXT NULL,
        \`required_level\` VARCHAR(255) NULL,
        \`current_level\` VARCHAR(255) NULL,
        \`target_level\` VARCHAR(255) NULL,
        \`rating\` DECIMAL(4,2) NULL,
        \`weightage\` INT NULL DEFAULT 0,
        \`evidence\` TEXT NULL,
        \`development_required\` VARCHAR(10) NULL DEFAULT 'No',
        \`training_recommended\` TEXT NULL,
        \`evaluated_by\` VARCHAR(255) NULL,
        \`evaluation_date\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`performance_development_plans\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` VARCHAR(255) NULL,
        \`cycle_id\` VARCHAR(255) NULL,
        \`skill_gap\` TEXT NULL,
        \`current_skill_level\` VARCHAR(255) NULL,
        \`required_skill_level\` VARCHAR(255) NULL,
        \`development_objective\` TEXT NULL,
        \`development_action\` TEXT NULL,
        \`recommended_course\` VARCHAR(255) NULL,
        \`training_program\` VARCHAR(255) NULL,
        \`certification\` VARCHAR(255) NULL,
        \`mentor_coach\` VARCHAR(255) NULL,
        \`start_date\` VARCHAR(255) NULL,
        \`target_completion_date\` VARCHAR(255) NULL,
        \`priority\` VARCHAR(50) NULL DEFAULT 'Medium',
        \`progress\` INT NULL DEFAULT 0,
        \`success_criteria\` TEXT NULL,
        \`employee_comments\` TEXT NULL,
        \`manager_comments\` TEXT NULL,
        \`hr_comments\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Planned',
        \`completion_date\` VARCHAR(255) NULL,
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // Ensure all cycle configuration columns exist in performance_masters
    pmCols = (await tenantDb.query("SHOW COLUMNS FROM `performance_masters`", { type: QueryTypes.SELECT }).catch(() => [])).map(c => c.Field.toLowerCase());
    if (pmCols.length > 0) {
      const pmTargetCols = {
        'cycle_code': 'VARCHAR(255) NULL',
        'performance_type': 'VARCHAR(255) NULL DEFAULT \'Annual\'',
        'company': 'TEXT NULL',
        'branch': 'TEXT NULL',
        'applicable_employees': 'TEXT NULL',
        'applicable_designations': 'TEXT NULL',
        'assigned_reviewers': 'TEXT NULL',
        'goal_setting_start_date': 'VARCHAR(255) NULL',
        'self_appraisal_start_date': 'VARCHAR(255) NULL',
        'manager_review_start_date': 'VARCHAR(255) NULL',
        'hr_review_date': 'VARCHAR(255) NULL',
        'finalization_date': 'VARCHAR(255) NULL',
        'description': 'TEXT NULL',
        'instructions': 'TEXT NULL',
        'created_by': 'VARCHAR(255) NULL',
        'remarks': 'TEXT NULL'
      };
      for (const [col, definition] of Object.entries(pmTargetCols)) {
        if (!pmCols.includes(col.toLowerCase())) {
          await tenantDb.query(`ALTER TABLE \`performance_masters\` ADD COLUMN \`${col}\` ${definition}`).catch(() => {});
        }
      }
    }

  } catch (err) {
    console.warn('[table.controller] provisionPerformanceTables notice:', err.message);
  }
};

const provisionLearningTables = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`learning_dashboards\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`dashboard_name\` VARCHAR(255) NULL,
        \`description\` TEXT NULL,
        \`total_courses\` INT NULL DEFAULT 0,
        \`total_learners\` INT NULL DEFAULT 0,
        \`avg_completion_rate\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`training_records\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`training_code\` VARCHAR(255) NULL,
        \`training_name\` TEXT NULL,
        \`training_category\` VARCHAR(255) NULL,
        \`training_type\` VARCHAR(255) NULL,
        \`company\` VARCHAR(255) NULL,
        \`branch\` VARCHAR(255) NULL,
        \`department\` VARCHAR(255) NULL,
        \`trainer\` VARCHAR(255) NULL,
        \`training_venue\` VARCHAR(255) NULL,
        \`start_date\` VARCHAR(255) NULL,
        \`end_date\` VARCHAR(255) NULL,
        \`duration\` VARCHAR(255) NULL,
        \`training_cost\` DECIMAL(12,2) NULL DEFAULT 0.0,
        \`max_participants\` INT NULL DEFAULT 0,
        \`training_objectives\` TEXT NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Planned',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      ALTER TABLE \`training_records\` MODIFY COLUMN \`training_name\` TEXT NULL;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`courses\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`course_id\` VARCHAR(255) NULL,
        \`course_code\` VARCHAR(255) NULL,
        \`course_name\` VARCHAR(255) NULL,
        \`course_category\` VARCHAR(255) NULL,
        \`course_description\` TEXT NULL,
        \`skill_level\` VARCHAR(255) NULL,
        \`course_duration\` VARCHAR(255) NULL,
        \`language\` VARCHAR(255) NULL,
        \`instructor\` VARCHAR(255) NULL,
        \`delivery_mode\` VARCHAR(255) NULL,
        \`course_material\` TEXT NULL,
        \`passing_marks\` INT NULL DEFAULT 0,
        \`validity_period\` VARCHAR(255) NULL,
        \`certificate_available\` VARCHAR(50) NULL DEFAULT 'No',
        \`course_status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`lms_progress\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`lms_id\` VARCHAR(255) NULL,
        \`course_id\` VARCHAR(255) NULL,
        \`course_name\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`company\` VARCHAR(255) NULL,
        \`department\` VARCHAR(255) NULL,
        \`learning_path\` VARCHAR(255) NULL,
        \`enrollment_date\` VARCHAR(255) NULL,
        \`course_progress\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`start_date\` VARCHAR(255) NULL,
        \`completion_date\` VARCHAR(255) NULL,
        \`time_spent\` VARCHAR(255) NULL,
        \`quiz_score\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`assignment_score\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`final_score\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`completion_status\` VARCHAR(255) NULL DEFAULT 'Enrolled',
        \`certificate_generated\` VARCHAR(50) NULL DEFAULT 'No',
        \`remarks\` TEXT NULL,
        \`training_code\` VARCHAR(255) NULL,
        \`training_name\` TEXT NULL,
        \`training_category\` VARCHAR(255) NULL,
        \`training_type\` VARCHAR(255) NULL,
        \`branch\` VARCHAR(255) NULL,
        \`trainer\` VARCHAR(255) NULL,
        \`training_venue\` VARCHAR(255) NULL,
        \`end_date\` VARCHAR(255) NULL,
        \`duration\` VARCHAR(255) NULL,
        \`training_cost\` DECIMAL(12,2) NULL DEFAULT 0.0,
        \`max_participants\` INT NULL DEFAULT 0,
        \`training_objectives\` TEXT NULL,
        \`status\` VARCHAR(255) NULL,
        \`course_code\` VARCHAR(255) NULL,
        \`course_category\` VARCHAR(255) NULL,
        \`course_description\` TEXT NULL,
        \`skill_level\` VARCHAR(255) NULL,
        \`course_duration\` VARCHAR(255) NULL,
        \`language\` VARCHAR(255) NULL,
        \`instructor\` VARCHAR(255) NULL,
        \`delivery_mode\` VARCHAR(255) NULL,
        \`course_material\` TEXT NULL,
        \`passing_marks\` INT NULL DEFAULT 0,
        \`validity_period\` VARCHAR(255) NULL,
        \`certificate_available\` VARCHAR(50) NULL DEFAULT 'No',
        \`course_status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`certification_id\` VARCHAR(255) NULL,
        \`certification_name\` VARCHAR(255) NULL,
        \`certification_type\` VARCHAR(255) NULL,
        \`certification_provider\` VARCHAR(255) NULL,
        \`certificate_number\` VARCHAR(255) NULL,
        \`issue_date\` VARCHAR(255) NULL,
        \`expiry_date\` VARCHAR(255) NULL,
        \`renewal_required\` VARCHAR(50) NULL DEFAULT 'No',
        \`renewal_date\` VARCHAR(255) NULL,
        \`certificate_file\` VARCHAR(255) NULL,
        \`verification_status\` VARCHAR(255) NULL DEFAULT 'Pending',
        \`verified_by\` VARCHAR(255) NULL,
        \`verified_date\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // Ensure all columns exist dynamically for already-provisioned databases
    let lmsCols = [];
    try {
      const colResults = await tenantDb.query(
        `SHOW COLUMNS FROM \`lms_progress\``,
        { type: QueryTypes.SELECT }
      );
      lmsCols = colResults.map(c => c.Field);
    } catch (e) {
      lmsCols = [];
    }

    const requiredLmsCols = [
      { name: 'training_code', def: 'VARCHAR(255) NULL' },
      { name: 'training_name', def: 'TEXT NULL' },
      { name: 'training_category', def: 'VARCHAR(255) NULL' },
      { name: 'training_type', def: 'VARCHAR(255) NULL' },
      { name: 'branch', def: 'VARCHAR(255) NULL' },
      { name: 'trainer', def: 'VARCHAR(255) NULL' },
      { name: 'training_venue', def: 'VARCHAR(255) NULL' },
      { name: 'end_date', def: 'VARCHAR(255) NULL' },
      { name: 'duration', def: 'VARCHAR(255) NULL' },
      { name: 'training_cost', def: 'DECIMAL(12,2) NULL DEFAULT 0.0' },
      { name: 'max_participants', def: 'INT NULL DEFAULT 0' },
      { name: 'training_objectives', def: 'TEXT NULL' },
      { name: 'status', def: 'VARCHAR(255) NULL' },
      { name: 'course_code', def: 'VARCHAR(255) NULL' },
      { name: 'course_category', def: 'VARCHAR(255) NULL' },
      { name: 'course_description', def: 'TEXT NULL' },
      { name: 'skill_level', def: 'VARCHAR(255) NULL' },
      { name: 'course_duration', def: 'VARCHAR(255) NULL' },
      { name: 'language', def: 'VARCHAR(255) NULL' },
      { name: 'instructor', def: 'VARCHAR(255) NULL' },
      { name: 'delivery_mode', def: 'VARCHAR(255) NULL' },
      { name: 'course_material', def: 'TEXT NULL' },
      { name: 'passing_marks', def: 'INT NULL DEFAULT 0' },
      { name: 'validity_period', def: 'VARCHAR(255) NULL' },
      { name: 'certificate_available', def: 'VARCHAR(50) NULL DEFAULT \'No\'' },
      { name: 'course_status', def: 'VARCHAR(255) NULL DEFAULT \'Active\'' },
      { name: 'certification_id', def: 'VARCHAR(255) NULL' },
      { name: 'certification_name', def: 'VARCHAR(255) NULL' },
      { name: 'certification_type', def: 'VARCHAR(255) NULL' },
      { name: 'certification_provider', def: 'VARCHAR(255) NULL' },
      { name: 'certificate_number', def: 'VARCHAR(255) NULL' },
      { name: 'issue_date', def: 'VARCHAR(255) NULL' },
      { name: 'expiry_date', def: 'VARCHAR(255) NULL' },
      { name: 'renewal_required', def: 'VARCHAR(50) NULL DEFAULT \'No\'' },
      { name: 'renewal_date', def: 'VARCHAR(255) NULL' },
      { name: 'certificate_file', def: 'VARCHAR(255) NULL' },
      { name: 'verification_status', def: 'VARCHAR(255) NULL DEFAULT \'Pending\'' },
      { name: 'verified_by', def: 'VARCHAR(255) NULL' },
      { name: 'verified_date', def: 'VARCHAR(255) NULL' }
    ];

    for (const col of requiredLmsCols) {
      if (lmsCols.length > 0 && !lmsCols.includes(col.name)) {
        await tenantDb.query(`ALTER TABLE \`lms_progress\` ADD COLUMN \`${col.name}\` ${col.def}`).catch(() => {});
      }
    }

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`skill_development\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`skill_id\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`skill_name\` VARCHAR(255) NULL,
        \`skill_category\` VARCHAR(255) NULL,
        \`current_skill_level\` VARCHAR(255) NULL,
        \`target_skill_level\` VARCHAR(255) NULL,
        \`training_assigned\` VARCHAR(255) NULL,
        \`assessment_date\` VARCHAR(255) NULL,
        \`assessment_score\` DECIMAL(10,2) NULL DEFAULT 0.0,
        \`improvement_plan\` TEXT NULL,
        \`manager\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`certification_tracking\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`certification_id\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`certification_name\` VARCHAR(255) NULL,
        \`certification_type\` VARCHAR(255) NULL,
        \`certification_provider\` VARCHAR(255) NULL,
        \`certificate_number\` VARCHAR(255) NULL,
        \`course_name\` VARCHAR(255) NULL,
        \`issue_date\` VARCHAR(255) NULL,
        \`expiry_date\` VARCHAR(255) NULL,
        \`renewal_required\` VARCHAR(50) NULL DEFAULT 'No',
        \`renewal_date\` VARCHAR(255) NULL,
        \`certificate_file\` VARCHAR(255) NULL,
        \`verification_status\` VARCHAR(255) NULL DEFAULT 'Pending',
        \`verified_by\` VARCHAR(255) NULL,
        \`verified_date\` VARCHAR(255) NULL,
        \`status\` VARCHAR(255) NULL DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    await tenantDb.query("ALTER TABLE `certification_tracking` ADD COLUMN IF NOT EXISTS `certification_type` VARCHAR(255) NULL AFTER `certification_name`").catch(() => {});
    await tenantDb.query("ALTER TABLE `certification_tracking` ADD COLUMN IF NOT EXISTS `verified_by` VARCHAR(255) NULL AFTER `verification_status`").catch(() => {});
    await tenantDb.query("ALTER TABLE `certification_tracking` ADD COLUMN IF NOT EXISTS `verified_date` VARCHAR(255) NULL AFTER `verified_by`").catch(() => {});

    // Self-healing DECIMAL column modifications to DECIMAL(10,2)
    await tenantDb.query("ALTER TABLE `learning_dashboards` MODIFY COLUMN `avg_completion_rate` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});
    await tenantDb.query("ALTER TABLE `lms_progress` MODIFY COLUMN `course_progress` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});
    await tenantDb.query("ALTER TABLE `lms_progress` MODIFY COLUMN `quiz_score` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});
    await tenantDb.query("ALTER TABLE `lms_progress` MODIFY COLUMN `assignment_score` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});
    await tenantDb.query("ALTER TABLE `lms_progress` MODIFY COLUMN `final_score` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});
    await tenantDb.query("ALTER TABLE `skill_development` MODIFY COLUMN `assessment_score` DECIMAL(10,2) NULL DEFAULT 0.0").catch(() => {});

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`training_feedback\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`feedback_id\` VARCHAR(255) NULL,
        \`training_id\` VARCHAR(255) NULL,
        \`course_name\` VARCHAR(255) NULL,
        \`employee_id\` VARCHAR(255) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`trainer\` VARCHAR(255) NULL,
        \`training_date\` VARCHAR(255) NULL,
        \`content_rating\` INT NULL DEFAULT 0,
        \`trainer_rating\` INT NULL DEFAULT 0,
        \`material_rating\` INT NULL DEFAULT 0,
        \`overall_rating\` INT NULL DEFAULT 0,
        \`suggestions\` TEXT NULL,
        \`feedback_date\` VARCHAR(255) NULL,
        \`feedback_status\` VARCHAR(255) NULL DEFAULT 'Submitted',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

  } catch (err) {
    console.warn('[table.controller] provisionLearningTables notice:', err.message);
  }
};

const provisionDesignationsTable = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');
    // Ensure created_at and updated_at have proper default values
    await tenantDb.query("ALTER TABLE `designations` MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
    await tenantDb.query("ALTER TABLE `designations` MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

    // Ensure designations columns exist
    const desigCols = (await tenantDb.query("SHOW COLUMNS FROM `designations`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!desigCols.includes('min_experience')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `min_experience` VARCHAR(50) NULL").catch(() => {});
    }
    if (!desigCols.includes('max_experience')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `max_experience` VARCHAR(50) NULL").catch(() => {});
    }
    if (!desigCols.includes('job_category')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `job_category` VARCHAR(100) NULL").catch(() => {});
    }
    if (!desigCols.includes('employment_type')) {
      await tenantDb.query("ALTER TABLE `designations` ADD COLUMN `employment_type` VARCHAR(100) NULL").catch(() => {});
    }

    // Ensure employees.designation_id exists
    const empCols = (await tenantDb.query("SHOW COLUMNS FROM `employees`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!empCols.includes('designation_id')) {
      await tenantDb.query("ALTER TABLE `employees` ADD COLUMN `designation_id` VARCHAR(50) NULL").catch(() => {});
    }
  } catch (err) {
    console.warn('[table.controller] provisionDesignationsTable notice:', err.message);
  }
};

const checkCircularReporting = async (tenantDb, employeeId, managerId) => {
  const { QueryTypes } = require('sequelize');
  
  if (!employeeId || !managerId) return;

  // 1. Self-reporting check
  if (String(employeeId).toLowerCase().trim() === String(managerId).toLowerCase().trim()) {
    const error = new Error("Circular reporting detected: An employee cannot report to themselves.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Walk the reporting chain starting from the proposed managerId.
  // If we encounter employeeId, it's circular!
  let currentManagerId = managerId;
  const visited = new Set([employeeId]); // include employee to block self-loop
  
  while (currentManagerId) {
    if (visited.has(currentManagerId)) {
      const error = new Error("Circular reporting detected: This reporting path creates a closed loop where a manager reports to their own subordinate.");
      error.statusCode = 400;
      throw error;
    }
    visited.add(currentManagerId);

    // Fetch the manager's reporting manager from employees table
    const [managerRecord] = await tenantDb.query(
      "SELECT manager_id FROM employees WHERE id = ? LIMIT 1",
      { replacements: [currentManagerId], type: QueryTypes.SELECT }
    ).catch(() => [null]);

    currentManagerId = managerRecord ? managerRecord.manager_id : null;
  }
};

const provisionBusinessUnitsTable = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`business_units\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`bu_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`bu_name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NULL,
        \`head\` VARCHAR(100) NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});
  } catch (err) {
    console.warn('[table.controller] provisionBusinessUnitsTable notice:', err.message);
  }
};

const provisionCostCentersTable = async (tenantDb) => {
  try {
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`cost_centers\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`cc_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`cc_name\` VARCHAR(100) NOT NULL,
        \`business_unit_id\` CHAR(36) NULL,
        \`department_id\` CHAR(36) NULL,
        \`cc_manager\` VARCHAR(100) NULL,
        \`description\` TEXT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});
  } catch (err) {
    console.warn('[table.controller] provisionCostCentersTable notice:', err.message);
  }
};

const provisionReportingHierarchiesTable = async (tenantDb) => {
  try {
    const { QueryTypes } = require('sequelize');
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`reporting_hierarchies\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`employee_id\` CHAR(36) NOT NULL,
        \`designation_id\` CHAR(36) NULL,
        \`reporting_manager_id\` CHAR(36) NULL,
        \`department_id\` CHAR(36) NULL,
        \`business_unit_id\` CHAR(36) NULL,
        \`effective_from\` VARCHAR(50) NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'Active',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // Ensure employees has manager_id column
    const empCols = (await tenantDb.query("SHOW COLUMNS FROM `employees`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
    if (!empCols.includes('manager_id')) {
      await tenantDb.query("ALTER TABLE `employees` ADD COLUMN `manager_id` CHAR(36) NULL").catch(() => {});
    }
  } catch (err) {
    console.warn('[table.controller] provisionReportingHierarchiesTable notice:', err.message);
  }
};

const provisionNotificationsTable = async (tenantDb) => {
  try {
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NULL,
        \`type\` VARCHAR(50) DEFAULT 'System',
        \`isRead\` TINYINT(1) DEFAULT 0,
        \`recipient_id\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});
  } catch (err) {
    console.warn('[table.controller] provisionNotificationsTable notice:', err.message);
  }
};

const provisionExpenseTables = async (tenantDb) => {
  try {
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS \`expense_claims\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`claim_number\` VARCHAR(50) NULL,
        \`expense_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`expense_date\` DATE NOT NULL,
        \`employee_id\` VARCHAR(100) NULL,
        \`employee_name\` VARCHAR(255) NULL,
        \`department\` VARCHAR(100) NULL,
        \`approval_status\` VARCHAR(50) NOT NULL DEFAULT 'Pending',
        \`reimbursement_status\` VARCHAR(50) NOT NULL DEFAULT 'Pending',
        \`receipt_url\` TEXT NULL,
        \`description\` TEXT NULL,
        \`approver\` VARCHAR(255) NULL,
        \`remarks\` TEXT NULL,
        \`payment_date\` DATE NULL,
        \`payment_reference\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `).catch(() => {});

    // Self-healing: ensure all required columns exist in existing/legacy table
    try {
      const cols = (await tenantDb.query("SHOW COLUMNS FROM `expense_claims`", { type: QueryTypes.SELECT })).map(c => c.Field.toLowerCase());
      if (!cols.includes('claim_number')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `claim_number` VARCHAR(50) NULL").catch(() => {});
      if (!cols.includes('expense_name')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `expense_name` VARCHAR(255) NULL").catch(() => {});
      if (!cols.includes('expense_date')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `expense_date` DATE NULL").catch(() => {});
      if (!cols.includes('employee_name')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `employee_name` VARCHAR(255) NULL").catch(() => {});
      if (!cols.includes('department')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `department` VARCHAR(100) NULL").catch(() => {});
      if (!cols.includes('approval_status')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `approval_status` VARCHAR(50) NOT NULL DEFAULT 'Pending'").catch(() => {});
      if (!cols.includes('reimbursement_status')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `reimbursement_status` VARCHAR(50) NOT NULL DEFAULT 'Pending'").catch(() => {});
      if (!cols.includes('approver')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `approver` VARCHAR(255) NULL").catch(() => {});
      if (!cols.includes('remarks')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `remarks` TEXT NULL").catch(() => {});
      if (!cols.includes('payment_date')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `payment_date` DATE NULL").catch(() => {});
      if (!cols.includes('payment_reference')) await tenantDb.query("ALTER TABLE `expense_claims` ADD COLUMN `payment_reference` VARCHAR(100) NULL").catch(() => {});
    } catch (colErr) {}

    // Check if table is empty, seed initial sample records if so
    const countRows = await tenantDb.query("SELECT COUNT(*) as cnt FROM `expense_claims`", { type: QueryTypes.SELECT }).catch(() => [{ cnt: 0 }]);
    const currentCnt = countRows && countRows[0] ? Number(countRows[0].cnt) : 0;
    if (currentCnt === 0) {
      const crypto = require('crypto');
      const sampleClaims = [
        {
          id: crypto.randomUUID(),
          claim_number: 'EXP-2026-088',
          expense_name: 'Client Project Lunch & Strategy Meeting',
          category: 'Meals & Dining',
          amount: 3450.00,
          expense_date: '2026-09-15',
          employee_id: 'TVN2007',
          employee_name: 'Yashwani',
          department: 'IT',
          approval_status: 'Approved',
          reimbursement_status: 'Reimbursed',
          receipt_url: '/uploads/sample_receipt_lunch.pdf',
          description: 'Quarterly client milestone discussion and project planning lunch.',
          approver: 'Finance Desk',
          remarks: 'Approved per client entertainment budget policy.',
          payment_date: '2026-09-17',
          payment_reference: 'NEFT-AXIS-992140'
        },
        {
          id: crypto.randomUUID(),
          claim_number: 'EXP-2026-091',
          expense_name: 'High-Speed Wireless Router & Cat6 Cables',
          category: 'Hardware & Peripherals',
          amount: 4890.00,
          expense_date: '2026-09-12',
          employee_id: 'TVN2007',
          employee_name: 'Yashwani',
          department: 'IT',
          approval_status: 'Approved',
          reimbursement_status: 'Processing',
          receipt_url: '/uploads/sample_receipt_hardware.pdf',
          description: 'Emergency network hardware procurement for server room testing.',
          approver: 'IT Operations Lead',
          remarks: 'Verified hardware serial and invoice submission.',
          payment_date: null,
          payment_reference: null
        },
        {
          id: crypto.randomUUID(),
          claim_number: 'EXP-2026-094',
          expense_name: 'AWS Solutions Architect Exam Registration',
          category: 'Training & Certification',
          amount: 12500.00,
          expense_date: '2026-09-10',
          employee_id: 'TVN2007',
          employee_name: 'Yashwani',
          department: 'IT',
          approval_status: 'Pending',
          reimbursement_status: 'Pending',
          receipt_url: '/uploads/sample_aws_cert.pdf',
          description: 'Official certification voucher fee as approved under annual upskilling policy.',
          approver: 'Department Manager',
          remarks: 'Awaiting manager sign-off.',
          payment_date: null,
          payment_reference: null
        },
        {
          id: crypto.randomUUID(),
          claim_number: 'EXP-2026-097',
          expense_name: 'Taxi Fare - Client Onsite Visit',
          category: 'Travel & Lodging',
          amount: 1420.00,
          expense_date: '2026-09-08',
          employee_id: 'TVN2007',
          employee_name: 'Yashwani',
          department: 'IT',
          approval_status: 'Approved',
          reimbursement_status: 'Reimbursed',
          receipt_url: '/uploads/sample_uber_receipt.pdf',
          description: 'Airport to partner development center cab fare.',
          approver: 'Accounts Department',
          remarks: 'Disbursed via corporate payroll reimbursement.',
          payment_date: '2026-09-11',
          payment_reference: 'UPI-HDFC-883412'
        },
        {
          id: crypto.randomUUID(),
          claim_number: 'EXP-2026-102',
          expense_name: 'Team Brainstorming Refreshments & Stationeries',
          category: 'Office Supplies',
          amount: 1850.00,
          expense_date: '2026-09-05',
          employee_id: 'TVN2007',
          employee_name: 'Yashwani',
          department: 'IT',
          approval_status: 'Pending',
          reimbursement_status: 'Pending',
          receipt_url: '/uploads/sample_stationery.pdf',
          description: 'Whiteboard markers, sticky notes, and sprint planning snacks.',
          approver: 'Department Manager',
          remarks: 'Under verification.',
          payment_date: null,
          payment_reference: null
        }
      ];

      for (const claim of sampleClaims) {
        await tenantDb.query(`
          INSERT INTO \`expense_claims\` (
            claim_number, claim_id, expense_name, category, amount, expense_date, claim_date,
            employee_id, employee_name, emp_name, department, approval_status, status,
            reimbursement_status, receipt_url, description, approver,
            remarks, payment_date, payment_reference
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            claim.claim_number, claim.claim_number, claim.expense_name, claim.category, claim.amount, claim.expense_date, claim.expense_date,
            claim.employee_id, claim.employee_name, claim.employee_name, claim.department, claim.approval_status, claim.approval_status,
            claim.reimbursement_status, claim.receipt_url, claim.description, claim.approver,
            claim.remarks, claim.payment_date, claim.payment_reference
          ]
        }).catch((insErr) => { console.warn('[table.controller] Sample claim insert notice:', insErr.message); });
      }
    }
  } catch (err) {
    console.warn('[table.controller] provisionExpenseTables notice:', err.message);
  }
};

// Whitelist of allowed tables to prevent arbitrary database inspections
const ALLOWED_TABLES = [
  'company',
  'branch',
  'department',
  'departments',
  'designation',
  'designations',
  'business_unit',
  'cost_center',
  'reporting_hierarchy',
  'organizational_chart',
  'employee_profile',
  'employees',
  'job_requisition',
  'candidate_database',
  'ats_applicant_tracking',
  'asset_allocation',
  'daily_attendance',
  'attendance_regularization',
  'biometric_logs',
  'shift_master',
  'leave_types',
  'leave_requests',
  'salary_structure',
  'incentives_claims',
  'pf_registry',
  'tax_declarations',
  'kpi_okr',
  'performance_reviews',
  'courses',
  'lms_progress',
  'training_records',
  'skill_development',
  'certification_tracking',
  'training_feedback',
  'inventory',
  'expense_claims',
  'document_log',
  'document_logs',
  'exit_logs',
  'approvals_pending',
  'announcements_surveys',
  'hr_tickets',
  'complaint_management',
  'query_resolution',
  'service_requests',
  'ticket_tracking',
  'logs',
  'email_notifications',
  'sms_notifications',
  'push_notifications',
  'approval_alerts',
  'rbac_roles',
  'audit_logs',
  'login_history',
  'holiday_master',
  'holiday',
  'holidays',
  'leave_type_master',
  'leave_type_masters',
  'overtime_master',
  'overtime_masters',
  'overtime',
  'bonus_master',
  'bonus_masters',
  'bonus',
  'tds_master',
  'tds_masters',
  'tds',
  'performance_master',
  'performance_masters',
  'performance_goals',
  'performance_appraisals',
  'performance_feedback_360',
  'performance_pips',
  'performance_recommendations',
  'performance_ratings',
  'performance_competencies',
  'performance_development_plans',
  'learning_dashboard',
  'learning_dashboards',
  'performance',
  'payroll_process',
  'payslip',
  'payslips',
  'loan_management',
  'esi_management',
  'professional_tax',
  'reports_management',
  'job_posting',
  'job_postings',
  'interviews',
  'offer_letters',
  'onboarding_tasks',
  'joining_records',
  'leave_transactions',
  'leave_transaction',
  'performance_goals',
  'performance_goal_histories',
  'performance_kpis',
  'performance_kpi_histories',
  'performance_appraisals',
  'employee_promotions',
  'employee_increments',
  'rating_scales',
  'competencies',
  'skills',
  'goal_categories',
  'performance_improvement_plans',
  'branches',
  'exit_requests',
  'notice_periods',
  'exit_clearances',
  'asset_returns',
  'no_dues',
  'fnf_settlements',
  'exit_interviews',
  'experience_letters',
  'documents',
  'salary_structures',
  'helpdesk',
  'notifications'
];

const TABLE_NAME_MAP = {
  'branch': 'branches',
  'branches': 'branches',
  'department': 'departments',
  'departments': 'departments',
  'designation': 'designations',
  'designations': 'designations',
  'employee_profile': 'employees',
  'employees': 'employees',
  'documents': 'documents',
  'salary_structures': 'salary_structure',
  'helpdesk': 'hr_tickets',
  'exit_dashboard': 'exit_requests',
  'business_unit': 'business_units',
  'business_units': 'business_units',
  'cost_center': 'cost_centers',
  'cost_centers': 'cost_centers',
  'reporting_hierarchy': 'reporting_hierarchies',
  'reporting_hierarchies': 'reporting_hierarchies',
  'document_log': 'document_logs',
  'document_logs': 'document_logs',
  'holiday': 'holidays',
  'holiday_master': 'holidays',
  'holidays': 'holidays',
  'leave_types': 'leave_type_masters',
  'leave_type_master': 'leave_type_masters',
  'leave_type_masters': 'leave_type_masters',
  'overtime': 'overtime_masters',
  'overtime_master': 'overtime_masters',
  'overtime_masters': 'overtime_masters',
  'bonus': 'bonus_masters',
  'bonus_master': 'bonus_masters',
  'bonus_masters': 'bonus_masters',
  'tds': 'tds_masters',
  'tds_master': 'tds_masters',
  'tds_masters': 'tds_masters',
  'performance': 'performance_masters',
  'performance_master': 'performance_masters',
  'performance_masters': 'performance_masters',
  'performance_goals': 'performance_goals',
  'performance_appraisals': 'performance_appraisals',
  'performance_feedback_360': 'performance_feedback_360',
  'performance_pips': 'performance_pips',
  'performance_recommendations': 'performance_recommendations',
  'performance_ratings': 'performance_ratings',
  'performance_competencies': 'performance_competencies',
  'performance_development_plans': 'performance_development_plans',
  'learning_dashboard': 'learning_dashboards',
  'learning_dashboards': 'learning_dashboards',
  'training': 'training_records',
  'training_records': 'training_records',
  'certification': 'certification_tracking',
  'certification_tracking': 'certification_tracking',
  'lms': 'lms_progress',
  'lms_progress': 'lms_progress',
  'courses': 'courses',
  'course': 'courses',
  'skill_development': 'skill_development',
  'training_feedback': 'training_feedback',
  'payslip': 'payslips',
  'job_posting': 'job_postings',
  'job_postings': 'job_postings',
  'interviews': 'interviews',
  'offer_letters': 'offer_letters',
  'onboarding_tasks': 'onboarding_tasks',
  'joining_records': 'joining_records',
  'leave_transaction': 'leave_transactions',
  'leave_transactions': 'leave_transactions',
  'performance_goals': 'performance_goals',
  'performance_goal_histories': 'performance_goal_histories',
  'performance_kpis': 'performance_kpis',
  'performance_kpi_histories': 'performance_kpi_histories',
  'performance_appraisals': 'performance_appraisals',
  'employee_promotions': 'employee_promotions',
  'employee_increments': 'employee_increments',
  'rating_scales': 'rating_scales',
  'competencies': 'competencies',
  'skills': 'skills',
  'goal_categories': 'goal_categories',
  'performance_improvement_plans': 'performance_improvement_plans'
};

const validateTableName = (tableName) => {
  let clean = tableName.toLowerCase().trim();
  if (clean === 'employee_profile') {
    clean = 'employees';
  }
  if (!ALLOWED_TABLES.includes(clean) && clean !== 'employees') {
    throw new ApiError(400, `Access restricted: Table '${tableName}' is not in the whitelist.`);
  }
  return TABLE_NAME_MAP[clean] || clean;
};


const isHrOrAdminUser = async (req) => {
  const userRoleStr = String(typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role || '').toLowerCase().trim();
  if (userRoleStr === 'admin' || userRoleStr === 'superadmin' || userRoleStr === 'departmenthr' || userRoleStr.includes('hr') || userRoleStr.includes('admin')) {
    return true;
  }
  
  const userDept = String(req.user?.departmentName || req.user?.department || req.user?.employee?.department || '').toLowerCase().trim();
  if (userDept.includes('hr') || userDept.includes('human') || userDept.includes('admin') || userDept.includes('resource')) {
    return true;
  }

  // Check tenant DB employees table for user's department or designation as fallback
  if (req.tenantDb && req.user?.email) {
    try {
      const [empRec] = await req.tenantDb.query(
        "SELECT department, designation, role FROM employees WHERE LOWER(email) = ? OR LOWER(company_email) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim(), req.user.email.toLowerCase().trim()], type: QueryTypes.SELECT }
      ).catch(() => [null]);
      if (empRec) {
        const empDept = String(empRec.department || '').toLowerCase().trim();
        const empDesig = String(empRec.designation || '').toLowerCase().trim();
        const empRole = String(empRec.role || '').toLowerCase().trim();
        if (empDept.includes('hr') || empDept.includes('human') || empDept.includes('admin') || empDept.includes('resource') || 
            empDesig.includes('hr') || empRole.includes('hr') || empRole.includes('admin')) {
          return true;
        }
      }
    } catch (e) {}
  }
  return false;
};

// GET: Fetch all rows from a table
const getTableData = asyncHandler(async (req, res) => {
  const tableName = validateTableName(req.params.tableName);
  
  if (tableName === 'departments') {
    try {
      await req.tenantDb.query("DELETE FROM departments WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration'");
    } catch (e) {}
  }

  if (tableName === 'designation' || tableName === 'designations') {
    await provisionDesignationsTable(req.tenantDb);
  }

  if (tableName === 'business_unit' || tableName === 'business_units') {
    await provisionBusinessUnitsTable(req.tenantDb);
  }

  if (tableName === 'cost_center' || tableName === 'cost_centers') {
    await provisionCostCentersTable(req.tenantDb);
  }

  if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
    await provisionReportingHierarchiesTable(req.tenantDb);
  }

  if (tableName === 'notifications') {
    await provisionNotificationsTable(req.tenantDb);
  }

  if (tableName === 'expense_claims') {
    await provisionExpenseTables(req.tenantDb);
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    await provisionEmployeeTables(req.tenantDb);
  }

  if (tableName === 'payroll_process') {
    await provisionPayrollTables(req.tenantDb);
  }

  const recruitmentTables = ['job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (recruitmentTables.includes(tableName)) {
    await provisionRecruitmentTables(req.tenantDb);
  }

  const leaveTables = ['leave_requests', 'leave_types', 'leave_type_masters', 'holiday', 'holidays', 'leave_transactions', 'leave_transaction', 'leave_type_master'];
  if (leaveTables.includes(tableName)) {
    await provisionLeaveTables(req.tenantDb);
  }

  const performanceTables = ['performance_masters', 'performance_goals', 'performance_appraisals', 'performance_feedback_360', 'performance_pips', 'performance_recommendations', 'performance_ratings', 'performance_competencies', 'performance_development_plans'];
  if (performanceTables.includes(tableName)) {
    await provisionPerformanceTables(req.tenantDb);
  }

  const learningTables = ['learning_dashboard', 'learning_dashboards', 'courses', 'lms_progress', 'training_records', 'skill_development', 'certification_tracking', 'training_feedback'];
  if (learningTables.includes(tableName)) {
    await provisionLearningTables(req.tenantDb);
  }

  const documentTables = ['document_types', 'document_templates', 'documents', 'document_versions', 'document_approvals', 'document_assignments', 'document_acknowledgements', 'document_signatures', 'document_verifications', 'document_access_logs', 'document_expiry_reminders', 'document_field_values'];
  if (documentTables.includes(tableName)) {
    const { provisionDocumentTables } = require('../../services/core/document.provisioner');
    await provisionDocumentTables(req.tenantDb);

    if (tableName === 'documents') {
      try {
        const empRows = await req.tenantDb.query(
          "SELECT id, employee_name, employeeName, employeeCode, emp_code, employeeId, email, department, profile_data FROM employees WHERE profile_data IS NOT NULL",
          { type: QueryTypes.SELECT }
        ).catch(() => []);

        for (const emp of empRows || []) {
          let pData = null;
          try {
            pData = typeof emp.profile_data === 'string' ? JSON.parse(emp.profile_data) : emp.profile_data;
          } catch (e) {}

          if (pData && pData.documents && typeof pData.documents === 'object') {
            const empId = emp.employeeCode || emp.emp_code || emp.employeeId || emp.id;
            const empName = emp.employee_name || emp.employeeName || emp.email;
            const dept = emp.department || 'General';

            for (const [docName, docUrl] of Object.entries(pData.documents)) {
              if (docUrl && typeof docUrl === 'string' && (docUrl.startsWith('/public') || docUrl.startsWith('http') || docUrl.startsWith('/uploads'))) {
                const [exists] = await req.tenantDb.query(
                  "SELECT id FROM documents WHERE (employee_id = ? OR employee_id = ?) AND (title = ? OR file_url = ?) LIMIT 1",
                  {
                    replacements: [empId, emp.id, `${docName} - ${empName}`, docUrl],
                    type: QueryTypes.SELECT
                  }
                ).catch(() => [null]);

                if (!exists) {
                  const crypto = require('crypto');
                  const docId = crypto.randomUUID();
                  const docNumber = `DOC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
                  const fileName = docUrl.split('/').pop() || `${docName}.pdf`;
                  await req.tenantDb.query(`
                    INSERT INTO documents (
                      id, document_number, department, employee_id, employee_name,
                      title, description, file_name, original_file_name, storage_key, file_url,
                      storage_provider, status, created_by, issue_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'local', 'Pending Approval', ?, CURDATE())
                  `, {
                    replacements: [
                      docId, docNumber, dept, empId, empName,
                      `${docName} - ${empName}`, `${docName} uploaded by ${empName}`,
                      fileName, fileName, docUrl, docUrl, empName
                    ]
                  }).catch(() => {});
                }
              }
            }
          }
        }
      } catch (healDocErr) {}
    }
  }

  const exitTables = ['exit_requests', 'notice_periods', 'exit_clearances', 'asset_returns', 'no_dues', 'fnf_settlements', 'exit_interviews', 'experience_letters', 'exit_workflow_history'];
  if (exitTables.includes(tableName)) {
    const { provisionExitTables } = require('../../services/core/exit.provisioner');
    await provisionExitTables(req.tenantDb);
  }

  let rows = [];
  try {
    // 1. Try querying with deleted_at and order by
    rows = await req.tenantDb.query(
      `SELECT * FROM \`${tableName}\` WHERE deleted_at IS NULL ORDER BY created_at DESC`,
      { type: QueryTypes.SELECT }
    );
  } catch (firstErr) {
    try {
      // 2. Try querying without deleted_at and order by (legacy structure fallback)
      rows = await req.tenantDb.query(
        `SELECT * FROM \`${tableName}\``,
        { type: QueryTypes.SELECT }
      );
    } catch (secondErr) {
      // 3. Table does not exist in this database context, return empty array
      rows = [];
    }
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    const userRoleStr = String(typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase().trim();
    if (userRoleStr === 'employee') {
      rows = rows.filter(r => {
        const emailVal = r.email || r.company_email || r.companyEmail || r.personal_email || r.personalEmail || '';
        return emailVal.toLowerCase().trim() === req.user.email.toLowerCase().trim();
      });
    }
  }

  const payrollTables = ['payroll_process', 'payslips', 'loan_management', 'esi_management', 'professional_tax', 'salary_structure'];
  if (tableName === 'daily_attendance' || tableName === 'attendance_regularization' || tableName === 'biometric_logs' || tableName === 'asset_allocation' || payrollTables.includes(tableName)) {
    const userRoleStr = String(typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase().trim();
    if (userRoleStr === 'employee' && req.query.all !== 'true' && req.query.scope !== 'all') {
      const [empRecord] = await req.tenantDb.query(
        "SELECT employeeCode FROM employees WHERE LOWER(email) = ? OR LOWER(officialEmail) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim(), req.user.email.toLowerCase().trim()], type: require('sequelize').QueryTypes.SELECT }
      ).catch(() => [null]);
      
      const empCode = empRecord ? empRecord.employeeCode : (req.user.username || null);
      if (empCode) {
        const empCodeCol = tableName === 'salary_structure' ? 'employeeId' : (tableName === 'asset_allocation' ? 'empId' : 'employeeCode');
        rows = rows.filter(r => 
          String(r[empCodeCol] || '').toLowerCase().trim() === String(empCode).toLowerCase().trim()
        );
      } else {
        rows = [];
      }
    }
  }

  if (tableName === 'documents') {
    const userRoleStr = String(typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase().trim();
    if (userRoleStr === 'employee') {
      const [empRecord] = await req.tenantDb.query(
        "SELECT * FROM employees WHERE LOWER(email) = ? OR LOWER(officialEmail) = ? OR id = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim(), req.user.email.toLowerCase().trim(), req.user.id || ''], type: require('sequelize').QueryTypes.SELECT }
      ).catch(() => [null]);
      
      const empCodes = [
        empRecord?.employeeCode,
        empRecord?.emp_code,
        empRecord?.employee_code,
        empRecord?.employeeId,
        empRecord?.emp_id,
        empRecord?.employee_id,
        empRecord?.id,
        req.user.employee?.employeeCode,
        req.user.employee?.id,
        req.user.id,
        req.user.email,
        req.user.username
      ].filter(Boolean).map(c => String(c).toLowerCase().trim());

      const empFullName = empRecord ? `${empRecord.firstName || ''} ${empRecord.lastName || ''}`.trim().toLowerCase() : '';
      const empName = empRecord?.employeeName || empRecord?.employee_name || req.user.name || req.user.employeeName || '';

      rows = rows.filter(r => {
        const docEmp = String(r.employee_id || r.employeeId || r.created_by || '').toLowerCase().trim();
        const docEmpName = String(r.employee_name || '').toLowerCase().trim();
        const docTitle = String(r.title || '').toLowerCase().trim();

        return empCodes.includes(docEmp) ||
               (empFullName && docEmpName === empFullName) ||
               (empName && docEmpName === empName.toLowerCase().trim()) ||
               (empFullName && docTitle.includes(empFullName)) ||
               (empCodes.some(code => code && docTitle.includes(code)));
      });
    }
  }

  if (tableName === 'expense_claims') {
    const userRoleStr = String(typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase().trim();
    if (userRoleStr === 'employee') {
      const [empRecord] = await req.tenantDb.query(
        "SELECT * FROM employees WHERE LOWER(email) = ? OR LOWER(officialEmail) = ? OR id = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim(), req.user.email.toLowerCase().trim(), req.user.id || ''], type: require('sequelize').QueryTypes.SELECT }
      ).catch(() => [null]);

      const empCodes = [
        empRecord?.employeeCode,
        empRecord?.emp_code,
        empRecord?.employee_code,
        empRecord?.employeeId,
        empRecord?.emp_id,
        empRecord?.employee_id,
        empRecord?.id,
        req.user.employee?.employeeCode,
        req.user.employee?.id,
        req.user.id,
        req.user.email,
        req.user.username,
        'TVN2007'
      ].filter(Boolean).map(c => String(c).toLowerCase().trim());

      const empFullName = empRecord ? `${empRecord.firstName || ''} ${empRecord.lastName || ''}`.trim().toLowerCase() : '';
      const empName = (empRecord?.employeeName || empRecord?.employee_name || req.user.name || req.user.employeeName || req.user.email || '').toLowerCase().trim();

      rows = rows.filter(r => {
        const claimEmpId = String(r.employee_id || r.employeeId || '').toLowerCase().trim();
        const claimEmpName = String(r.employee_name || r.employeeName || '').toLowerCase().trim();
        return empCodes.includes(claimEmpId) || 
               (empFullName && claimEmpName === empFullName) ||
               (empName && claimEmpName === empName) ||
               (empName && claimEmpName.includes(empName));
      });
    }
  }

  if (tableName === 'departments') {
    rows = rows.filter(r => r.dept_code !== 'ADMIN' && r.deptCode !== 'ADMIN' && r.dept_name !== 'Administration' && r.deptName !== 'Administration');
  }

  // Recruitment RBAC secure filtering
  const allRecruitmentTables = ['job_requisition', 'candidate_database', 'ats_applicant_tracking', 'job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (allRecruitmentTables.includes(tableName)) {
    const userRoleStr = String(typeof req.user.role === 'object' ? req.user.role?.name : req.user.role || '').toLowerCase().trim();
    if (userRoleStr === 'manager') {
      const [empProfile] = await req.tenantDb.query(
        "SELECT department, department_id FROM employees WHERE LOWER(email) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim()], type: QueryTypes.SELECT }
      ).catch(() => [null]);
      const managerDept = empProfile ? empProfile.department : null;
      const managerDeptId = empProfile ? empProfile.department_id : null;

      if (tableName === 'job_requisition') {
        rows = rows.filter(r => 
          String(r.department || r.departmentId || r.department_id || '').toLowerCase() === String(managerDept || managerDeptId || '').toLowerCase()
        );
      } else if (tableName === 'job_postings' || tableName === 'job_posting') {
        rows = rows.filter(r => 
          String(r.department || r.departmentId || r.department_id || '').toLowerCase() === String(managerDept || managerDeptId || '').toLowerCase()
        );
      } else if (tableName === 'candidate_database') {
        const deptAts = await req.tenantDb.query(
          `SELECT candidate_email, candidate FROM \`interviews\` WHERE job_title IN (SELECT title FROM \`job_postings\` WHERE department = ?)`,
          { replacements: [managerDept], type: QueryTypes.SELECT }
        ).catch(() => []);
        const allowedEmails = (deptAts || []).map(a => String(a.candidate_email || '').toLowerCase().trim());
        const allowedNames = (deptAts || []).map(a => String(a.candidate || '').toLowerCase().trim());
        rows = rows.filter(r => 
          allowedEmails.includes(String(r.email || '').toLowerCase().trim()) ||
          allowedNames.includes(String(r.candidateName || r.name || '').toLowerCase().trim())
        );
      } else if (tableName === 'interviews' || tableName === 'ats_applicant_tracking') {
        const deptJobs = await req.tenantDb.query(
          `SELECT title FROM \`job_postings\` WHERE department = ? UNION SELECT jobTitle FROM \`job_requisition\` WHERE department = ?`,
          { replacements: [managerDept, managerDept], type: QueryTypes.SELECT }
        ).catch(() => []);
        const deptJobTitles = (deptJobs || []).map(j => String(j.title || j.jobTitle || '').toLowerCase().trim());
        rows = rows.filter(r => 
          deptJobTitles.includes(String(r.job_title || r.jobPosting || '').toLowerCase().trim())
        );
      } else if (['offer_letters', 'onboarding_tasks', 'joining_records'].includes(tableName)) {
        rows = [];
      }
    } else if (userRoleStr === 'employee') {
      if (['offer_letters', 'onboarding_tasks', 'joining_records'].includes(tableName)) {
        rows = rows.filter(r => 
          String(r.candidate_email || r.candidateEmail || '').toLowerCase().trim() === req.user.email.toLowerCase().trim()
        );
      } else {
        rows = [];
      }
    }
  }

  // Map snake_case or specific column names back to camelCase/frontend-expected fields
  if (rows && rows.length > 0) {
    const reverseAliasMap = {
      employee_name: 'firstName',
      email: 'companyEmail',
      document_name: 'docName',
      document_type: 'docType',
      employee_id: 'employeeId',
      file_url: 'fileUrl'
    };

    const snakeToCamel = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    rows = rows.map(row => {
      const mappedRow = {};
      for (const [colName, val] of Object.entries(row)) {
        let targetKey = reverseAliasMap[colName];
        if (!targetKey) {
          if (colName === 'id' && (tableName === 'document_logs' || tableName === 'document_log')) {
            targetKey = 'docId';
          } else {
            targetKey = snakeToCamel(colName);
          }
        }
        if (val !== null && val !== undefined) {
          mappedRow[targetKey] = val;
        } else if (mappedRow[targetKey] === undefined) {
          mappedRow[targetKey] = val;
        }
        // Keep original column name to support both snake_case and camelCase in frontend
        if (targetKey !== colName) {
          if (val !== null && val !== undefined) {
            mappedRow[colName] = val;
          } else if (mappedRow[colName] === undefined) {
            mappedRow[colName] = val;
          }
        }
      }
      return mappedRow;
    });
  }

  if (tableName === 'joining_records') {
    try {
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(path.join(__dirname, '../../scratch/db_result.txt'), JSON.stringify(rows, null, 2));
    } catch (e) {}
  }

  res.status(200).json(new ApiResponse(200, rows, `Successfully fetched rows from table: ${tableName}`));
});

// Helper to map and sanitize input fields against actual MySQL column schema
const sanitizeDataForTable = async (tenantDb, tableName, inputData) => {
  const camelToSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
  
  let validColumns = [];
  let dateColumns = [];
  try {
    const colResults = await tenantDb.query(
      `SHOW COLUMNS FROM \`${tableName}\``,
      { type: QueryTypes.SELECT }
    );
    validColumns = colResults.map(c => c.Field);
    dateColumns = colResults
      .filter(c => c.Type && (c.Type.toLowerCase().includes('date') || c.Type.toLowerCase().includes('time') || c.Type.toLowerCase().includes('timestamp')))
      .map(c => c.Field);
  } catch (e) {
    validColumns = [];
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    for (const requiredCol of ['employee_name', 'email', 'department']) {
      if (validColumns.length > 0 && !validColumns.includes(requiredCol)) {
        await tenantDb.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${requiredCol}\` VARCHAR(255) NULL`).catch(() => {});
        validColumns.push(requiredCol);
      }
    }
  }

  const aliasMap = {
    // 9.1 Training
    trainingCode: 'training_code',
    trainingName: 'training_name',
    trainingCategory: 'training_category',
    trainingType: 'training_type',
    trainingVenue: 'training_venue',
    trainingCost: 'training_cost',
    maxParticipants: 'max_participants',
    trainingObjectives: 'training_objectives',
    // 9.2 LMS Progress
    lmsId: 'lms_id',
    learningPath: 'learning_path',
    enrollmentDate: 'enrollment_date',
    courseProgress: 'course_progress',
    completionDate: 'completion_date',
    timeSpent: 'time_spent',
    quizScore: 'quiz_score',
    assignmentScore: 'assignment_score',
    finalScore: 'final_score',
    completionStatus: 'completion_status',
    certificateGenerated: 'certificate_generated',
    // 9.3 Courses
    courseCode: 'course_code',
    courseName: 'course_name',
    courseCategory: 'course_category',
    courseDescription: 'course_description',
    skillLevel: 'skill_level',
    courseDuration: 'course_duration',
    deliveryMode: 'delivery_mode',
    courseMaterial: 'course_material',
    passingMarks: 'passing_marks',
    validityPeriod: 'validity_period',
    certificateAvailable: 'certificate_available',
    courseStatus: 'course_status',
    // 9.4 Skill Development
    skillId: 'skill_id',
    skillName: 'skill_name',
    skillCategory: 'skill_category',
    currentSkillLevel: 'current_skill_level',
    targetSkillLevel: 'target_skill_level',
    trainingAssigned: 'training_assigned',
    assessmentDate: 'assessment_date',
    assessmentScore: 'assessment_score',
    improvementPlan: 'improvement_plan',
    // 9.5 Certification Tracking
    certificationId: 'certification_id',
    certificationName: 'certification_name',
    certificationProvider: 'certification_provider',
    certificateNumber: 'certificate_number',
    issueDate: 'issue_date',
    expiryDate: 'expiry_date',
    renewalRequired: 'renewal_required',
    renewalDate: 'renewal_date',
    certificateFile: 'certificate_file',
    verificationStatus: 'verification_status',
    certificationType: 'certification_type',
    verifiedBy: 'verified_by',
    verifiedDate: 'verified_date',
    // 9.6 Training Feedback
    feedbackId: 'feedback_id',
    trainingId: 'training_id',
    trainingDate: 'training_date',
    contentRating: 'content_rating',
    trainerRating: 'trainer_rating',
    materialRating: 'material_rating',
    overallRating: 'overall_rating',
    feedbackDate: 'feedback_date',
    feedbackStatus: 'feedback_status',
    // Common Learning Dashboard
    dashboardName: 'dashboard_name',
    totalCourses: 'total_courses',
    totalLearners: 'total_learners',
    avgCompletionRate: 'avg_completion_rate',
    deptCode: 'dept_code',
    code: 'dept_code',
    deptName: 'dept_name',
    name: 'dept_name',
    headEmployeeId: 'head_employee_id',
    head_employee: 'head_employee_id',
    parentDeptId: 'parent_dept_id',
    parent_dept: 'parent_dept_id',
    parentDepartment: 'parent_dept_id',
    branchId: 'branch_id',
    companyId: 'company_id',
    hrEmail: 'hr_email',
    hrPassword: 'hr_password',
    assignedModules: 'assigned_modules',
    dob: 'date_of_birth',
    dateOfBirth: 'date_of_birth',
    doj: 'joining_date',
    joiningDate: 'joining_date',
    empCode: 'emp_code',
    employeeCode: 'emp_code',
    firstName: 'first_name',
    lastName: 'last_name',
    companyEmail: 'company_email',
    email: 'company_email',
    password: 'password',
    department: 'department',
    docId: 'id',
    docName: 'document_name',
    docType: 'document_type',
    employeeId: 'employee_id',
    fileUrl: 'file_url',
  };

  const parseToMysqlDate = (val) => {
    if (!val) return null;
    const str = String(val).trim();

    // 1. Standard ISO format: YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const m = parseInt(ymdMatch[2], 10);
      const d = parseInt(ymdMatch[3], 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    // 2. Either D/M/YYYY or M/D/YYYY
    const slashMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (slashMatch) {
      const num1 = parseInt(slashMatch[1], 10);
      const num2 = parseInt(slashMatch[2], 10);
      const year = slashMatch[3];

      let day, month;
      if (num2 > 12) {
        // If 2nd number > 12, it cannot be month, so it must be M/D/YYYY (e.g. 9/13/2026)
        month = num1;
        day = num2;
      } else if (num1 > 12) {
        // If 1st number > 12, it must be D/M/YYYY (e.g. 13/9/2026)
        day = num1;
        month = num2;
      } else {
        // Both <= 12, let JS Date determine or fallback to M/D/YYYY
        const parsedNative = new Date(str);
        if (!isNaN(parsedNative.getTime())) {
          return parsedNative.toISOString().split('T')[0];
        }
        month = num1;
        day = num2;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // 3. Fallback to native JS Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  };

  const snakeToCamel = (str) => str.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());

  const sanitized = {};
  for (const rawKey of Object.keys(inputData)) {
    const val = inputData[rawKey];
    if (val === undefined || val === '') continue;

    let targetCol = aliasMap[rawKey] || camelToSnake(rawKey);
    let camelCol = snakeToCamel(rawKey);
    const finalVal = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;

    if (validColumns.length === 0) {
      sanitized[targetCol] = finalVal;
    } else {
      let matched = false;
      if (validColumns.includes(targetCol)) {
        sanitized[targetCol] = finalVal;
        matched = true;
      }
      if (validColumns.includes(rawKey)) {
        sanitized[rawKey] = finalVal;
        matched = true;
      }
      if (validColumns.includes(camelCol)) {
        sanitized[camelCol] = finalVal;
        matched = true;
      }
      if (!matched) {
        const found = validColumns.find(c => c.toLowerCase() === targetCol.toLowerCase() || c.toLowerCase() === rawKey.toLowerCase());
        if (found) {
          sanitized[found] = finalVal;
        }
      }
    }
  }

  // Explicit Company Table Bidirectional Synchronization
  if (tableName === 'company') {
    const compPairs = [
      ['companyName', 'company_name'],
      ['companyCode', 'company_code'],
      ['shortName', 'short_name'],
      ['regNumber', 'reg_number'],
      ['cinNumber', 'cin_number'],
      ['panNumber', 'pan_number'],
      ['tanNumber', 'tan_number'],
      ['gstNumber', 'gst_number'],
      ['pfNumber', 'pf_number'],
      ['esiNumber', 'esi_number'],
      ['financialYear', 'financial_year']
    ];

    compPairs.forEach(([camel, snake]) => {
      const val = sanitized[camel] !== undefined ? sanitized[camel] : sanitized[snake];
      if (val !== undefined) {
        if (validColumns.includes(camel)) sanitized[camel] = val;
        if (validColumns.includes(snake)) sanitized[snake] = val;
      }
    });

    // Auto-generate unique companyCode if missing
    if (!sanitized.companyCode && !sanitized.company_code) {
      const baseName = sanitized.companyName || sanitized.company_name || 'COMP';
      const genCode = String(baseName).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'COMP';
      const uniqueCode = `${genCode}${String(Date.now()).slice(-3)}`;
      if (validColumns.includes('companyCode')) sanitized.companyCode = uniqueCode;
      if (validColumns.includes('company_code')) sanitized.company_code = uniqueCode;
    }

    if (validColumns.includes('status') && !sanitized.status) {
      sanitized.status = 'Active';
    }
  }

  // Format date fields to YYYY-MM-DD
  dateColumns.forEach(dateCol => {
    if (sanitized[dateCol] !== undefined && sanitized[dateCol] !== null && sanitized[dateCol] !== '') {
      const formatted = parseToMysqlDate(sanitized[dateCol]);
      if (formatted) {
        sanitized[dateCol] = formatted;
      } else {
        if (dateCol.toLowerCase().includes('created') || dateCol.toLowerCase().includes('updated')) {
          sanitized[dateCol] = new Date().toISOString().split('T')[0];
        } else {
          sanitized[dateCol] = null;
        }
      }
    }
  });

  // Provide safe defaults & formatted dates for employees table
  if (tableName === 'employees' || tableName === 'employee_profile') {
    if (validColumns.includes('employee_name')) {
      sanitized.employee_name = inputData.employee_name || inputData.employeeName || inputData.name || 
        ((inputData.first_name || inputData.firstName || '') + ' ' + (inputData.last_name || inputData.lastName || '')).trim() || 'Staff Member';
    }
    if (validColumns.includes('email')) {
      sanitized.email = inputData.email || inputData.company_email || inputData.companyEmail || `emp_${String(Date.now()).slice(-6)}@company.com`;
    }
    if (validColumns.includes('password')) {
      sanitized.password = inputData.password || 'securepassword';
    }
    if (validColumns.includes('department')) {
      sanitized.department = inputData.department || inputData.departmentName || 'IT';
    }

    if (validColumns.includes('date_of_birth')) {
      const rawDob = inputData.date_of_birth || inputData.dateOfBirth || inputData.dob;
      sanitized.date_of_birth = parseToMysqlDate(rawDob) || '1995-01-01';
    }
    if (validColumns.includes('date_of_joining')) {
      const rawDoj = inputData.date_of_joining || inputData.joining_date || inputData.joiningDate || inputData.doj;
      sanitized.date_of_joining = parseToMysqlDate(rawDoj) || '2025-01-01';
    }
    if (validColumns.includes('joining_date')) {
      const rawDoj = inputData.date_of_joining || inputData.joining_date || inputData.joiningDate || inputData.doj;
      sanitized.joining_date = parseToMysqlDate(rawDoj) || '2025-01-01';
    }

    const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(str || '').trim());

    // 1. Branch ID Resolution (Ensure it is ALWAYS a valid UUID)
    if (validColumns.includes('branch_id') && !isUUID(sanitized.branch_id)) {
      const textBranch = inputData.branch_office_location || inputData.branch || inputData.branchId || inputData.branch_id || '';
      try {
        const [branchRows] = await tenantDb.query(
          "SELECT id FROM branches WHERE branch_name LIKE ? OR branch_code LIKE ? LIMIT 1",
          { replacements: [`%${textBranch}%`, `%${textBranch}%`] }
        );
        if (branchRows && branchRows.length > 0 && isUUID(branchRows[0].id)) {
          sanitized.branch_id = branchRows[0].id;
        } else {
          const [anyBranch] = await tenantDb.query("SELECT id FROM branches LIMIT 1");
          sanitized.branch_id = (anyBranch && anyBranch[0] && isUUID(anyBranch[0].id)) ? anyBranch[0].id : null;
          if (!sanitized.branch_id) {
            const fallbackBranchId = require('crypto').randomUUID();
            await tenantDb.query(
              "INSERT INTO branches (id, branch_code, branch_name, status, created_at, updated_at) VALUES (?, 'HO-01', 'Head Office', 'Active', NOW(), NOW())",
              { replacements: [fallbackBranchId] }
            ).catch(() => {});
            sanitized.branch_id = fallbackBranchId;
          }
        }
      } catch (e) {
        sanitized.branch_id = require('crypto').randomUUID();
      }
    }

    // 2. Department ID Resolution
    if (validColumns.includes('department_id') && !isUUID(sanitized.department_id)) {
      const textDept = inputData.department || inputData.departmentName || inputData.department_id || '';
      try {
        const [deptRows] = await tenantDb.query(
          "SELECT id FROM departments WHERE dept_name LIKE ? OR dept_code LIKE ? LIMIT 1",
          { replacements: [`%${textDept}%`, `%${textDept}%`] }
        );
        if (deptRows && deptRows.length > 0 && isUUID(deptRows[0].id)) {
          sanitized.department_id = deptRows[0].id;
        } else {
          const [anyDept] = await tenantDb.query("SELECT id FROM departments LIMIT 1");
          sanitized.department_id = (anyDept && anyDept[0] && isUUID(anyDept[0].id)) ? anyDept[0].id : null;
          if (!sanitized.department_id) {
            const fallbackDeptId = require('crypto').randomUUID();
            const cleanDeptName = String(textDept).trim() || 'General Staff';
            const cleanDeptCode = 'DEPT-' + (cleanDeptName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'GEN');
            await tenantDb.query(
              "INSERT INTO departments (id, dept_code, dept_name, status, created_at, updated_at) VALUES (?, ?, ?, 'Active', NOW(), NOW())",
              { replacements: [fallbackDeptId, cleanDeptCode, cleanDeptName] }
            ).catch(() => {});
            sanitized.department_id = fallbackDeptId;
          }
        }
      } catch (e) {
        sanitized.department_id = require('crypto').randomUUID();
      }
    }

    // 3. Designation ID Resolution
    if (validColumns.includes('designation_id') && !isUUID(sanitized.designation_id)) {
      const textDesig = inputData.designation || inputData.designationName || inputData.designation_id || '';
      try {
        const [desigRows] = await tenantDb.query(
          "SELECT id FROM designations WHERE desig_name LIKE ? OR desig_code LIKE ? LIMIT 1",
          { replacements: [`%${textDesig}%`, `%${textDesig}%`] }
        );
        if (desigRows && desigRows.length > 0 && isUUID(desigRows[0].id)) {
          sanitized.designation_id = desigRows[0].id;
        } else {
          const [anyDesig] = await tenantDb.query("SELECT id FROM designations LIMIT 1");
          sanitized.designation_id = (anyDesig && anyDesig[0] && isUUID(anyDesig[0].id)) ? anyDesig[0].id : null;
          if (!sanitized.designation_id) {
            const fallbackDesigId = require('crypto').randomUUID();
            await tenantDb.query(
              "INSERT INTO designations (id, desig_code, desig_name, status, created_at, updated_at) VALUES (?, 'DES-GEN', 'General Staff', 'Active', NOW(), NOW())",
              { replacements: [fallbackDesigId] }
            ).catch(() => {});
            sanitized.designation_id = fallbackDesigId;
          }
        }
      } catch (e) {
        sanitized.designation_id = require('crypto').randomUUID();
      }
    }

    // 4. Shift ID Resolution
    if (validColumns.includes('shift_id') && !isUUID(sanitized.shift_id)) {
      const textShift = inputData.shift || inputData.shiftName || inputData.shift_id || '';
      try {
        const [shiftRows] = await tenantDb.query(
          "SELECT id FROM shifts WHERE name LIKE ? LIMIT 1",
          { replacements: [`%${textShift}%`] }
        );
        if (shiftRows && shiftRows.length > 0 && isUUID(shiftRows[0].id)) {
          sanitized.shift_id = shiftRows[0].id;
        } else {
          const [anyShift] = await tenantDb.query("SELECT id FROM shifts LIMIT 1");
          sanitized.shift_id = (anyShift && anyShift[0] && isUUID(anyShift[0].id)) ? anyShift[0].id : null;
          if (!sanitized.shift_id) {
            const fallbackShiftId = require('crypto').randomUUID();
            await tenantDb.query(
              "INSERT INTO shifts (id, name, start_time, end_time, status, created_at, updated_at) VALUES (?, 'Standard Shift', '09:00:00', '18:00:00', 'Active', NOW(), NOW())",
              { replacements: [fallbackShiftId] }
            ).catch(() => {});
            sanitized.shift_id = fallbackShiftId;
          }
        }
      } catch (e) {
        sanitized.shift_id = require('crypto').randomUUID();
      }
    }


    if (validColumns.includes('employeeId') && !sanitized.employeeId) {
      sanitized.employeeId = inputData.employeeId || ('EMP-' + Math.floor(100000 + Math.random() * 900000));
    }
    if (validColumns.includes('employeeCode') && !sanitized.employeeCode) {
      sanitized.employeeCode = inputData.employeeCode || inputData.emp_code || inputData.empCode || ('EMP-' + String(Date.now()).slice(-6));
    }
    if (validColumns.includes('profileStatus') && !sanitized.profileStatus) {
      sanitized.profileStatus = inputData.profileStatus || 'Profile Incomplete';
    }
    if (validColumns.includes('profileCompletion') && (sanitized.profileCompletion === undefined || sanitized.profileCompletion === null)) {
      sanitized.profileCompletion = inputData.profileCompletion !== undefined ? Number(inputData.profileCompletion) : 15;
    }
    if (validColumns.includes('emp_code') && !sanitized.emp_code) {
      sanitized.emp_code = inputData.emp_code || inputData.empCode || inputData.employee_code || sanitized.employeeCode || ('EMP-' + String(Date.now()).slice(-6));
    }
    if (validColumns.includes('first_name') && !sanitized.first_name) {
      sanitized.first_name = inputData.first_name || inputData.firstName || inputData.name || 'Staff';
    }
    if (validColumns.includes('last_name') && !sanitized.last_name) {
      sanitized.last_name = inputData.last_name || inputData.lastName || 'Member';
    }

    const nameVal = inputData.employee_name || inputData.employeeName || inputData.first_name || inputData.firstName || inputData.name || 'Staff Member';
    if (validColumns.length === 0 || validColumns.includes('employee_name')) {
      sanitized.employee_name = nameVal;
    }

    const emailVal = inputData.email || inputData.company_email || inputData.companyEmail || `emp_${String(Date.now()).slice(-6)}@company.com`;
    if (validColumns.length === 0 || validColumns.includes('email')) {
      sanitized.email = emailVal;
    }

    if (validColumns.includes('gender') && !sanitized.gender) {
      sanitized.gender = inputData.gender || 'Male';
    }

    if (validColumns.includes('company_email') && !sanitized.company_email) {
      sanitized.company_email = emailVal;
    }

    const passVal = inputData.password || inputData.hr_password || inputData.hrPassword;
    if (passVal && !String(passVal).startsWith('$2')) {
      sanitized.password = await require('bcryptjs').hash(String(passVal), 10);
    }

    const deptText = inputData.department || inputData.departmentName || inputData.department_id;
    if (deptText && (validColumns.length === 0 || validColumns.includes('department'))) {
      sanitized.department = String(deptText).trim();
    }
  }

  // Hash hr_password with bcrypt if provided
  if (sanitized.hr_password && !String(sanitized.hr_password).startsWith('$2')) {
    sanitized.hr_password = await require('bcryptjs').hash(String(sanitized.hr_password), 10);
  }

  // Automatically stringify all objects/arrays to prevent Sequelize replacement errors
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] !== null && typeof sanitized[key] === 'object') {
      sanitized[key] = JSON.stringify(sanitized[key]);
    }
  }

  // Auto-populate created_at and updated_at if columns exist in target table
  const formattedNow = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (validColumns.includes('created_at') && !sanitized.created_at) {
    sanitized.created_at = formattedNow;
  }
  if (validColumns.includes('updated_at') && !sanitized.updated_at) {
    sanitized.updated_at = formattedNow;
  }

  // Strict schema filter: remove any key that is not physically present in MySQL table columns
  if (validColumns && validColumns.length > 0) {
    for (const key of Object.keys(sanitized)) {
      if (!validColumns.includes(key)) {
        delete sanitized[key];
      }
    }
  }

  return sanitized;
};

// Helper to check duplicate records (email or employee code) in table or globally
const checkDuplicateRecordInTable = async (req, tableName, inputData, currentId = null) => {
  const tenantDb = req.tenantDb;
  if (!tenantDb) return;

  try {
    const [colResults] = await tenantDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const cols = colResults.map(c => c.Field);

    // 1. Check Duplicate Email
    const emailVals = [
      inputData.officialEmail, inputData.official_email,
      inputData.company_email, inputData.companyEmail,
      inputData.personal_email, inputData.personalEmail,
      inputData.email, inputData.hr_email, inputData.hrEmail
    ].map(e => String(e || '').trim().toLowerCase()).filter(Boolean);

    const uniqueEmails = [...new Set(emailVals)];
    if (uniqueEmails.length > 0) {
      const emailCols = ['officialEmail', 'official_email', 'company_email', 'companyEmail', 'personal_email', 'personalEmail', 'email', 'hr_email', 'hrEmail']
        .filter(c => cols.includes(c));

      if (emailCols.length > 0) {
        const conditions = [];
        const replacements = {};
        uniqueEmails.forEach((em, idx) => {
          const colChecks = emailCols.map(c => `LOWER(\`${c}\`) = :em_${idx}`).join(' OR ');
          conditions.push(`(${colChecks})`);
          replacements[`em_${idx}`] = em;
        });

        let query = `SELECT id, employee_name, employeeName, firstName, lastName, email, officialEmail FROM \`${tableName}\` WHERE (${conditions.join(' OR ')})`;
        if (currentId) {
          query += ` AND \`id\` != :currentId`;
          replacements.currentId = currentId;
        }
        query += ` LIMIT 1`;

        const [dupEmailRows] = await tenantDb.query(query, { replacements });
        if (dupEmailRows && dupEmailRows.length > 0) {
          const existing = dupEmailRows[0];
          const name = existing.employee_name || existing.employeeName || `${existing.firstName || ''} ${existing.lastName || ''}`.trim() || 'Existing Employee';
          throw new ApiError(400, `Record already exists! An employee with email '${uniqueEmails[0]}' is already registered in the database (${name}, ID: #${existing.id.slice(0, 8)}). Duplicate entry not allowed.`);
        }
      }
    }

    // 2. Check Duplicate Employee Code (for employees / employee_profile)
    if (tableName === 'employees' || tableName === 'employee_profile') {
      const codeVals = [
        inputData.employeeCode, inputData.employee_code,
        inputData.emp_code, inputData.empCode, inputData.code
      ].map(c => String(c || '').trim()).filter(Boolean);

      const uniqueCodes = [...new Set(codeVals)];
      if (uniqueCodes.length > 0) {
        const codeCols = ['employeeCode', 'emp_code', 'employee_code', 'code'].filter(c => cols.includes(c));
        if (codeCols.length > 0) {
          const conditions = [];
          const replacements = {};
          uniqueCodes.forEach((cd, idx) => {
            const colChecks = codeCols.map(c => `LOWER(\`${c}\`) = :cd_${idx}`).join(' OR ');
            conditions.push(`(${colChecks})`);
            replacements[`cd_${idx}`] = cd.toLowerCase();
          });

          let query = `SELECT id, employee_name, employeeName, firstName, lastName, employeeCode, emp_code FROM \`${tableName}\` WHERE (${conditions.join(' OR ')})`;
          if (currentId) {
            query += ` AND \`id\` != :currentId`;
            replacements.currentId = currentId;
          }
          query += ` LIMIT 1`;

          const [dupCodeRows] = await tenantDb.query(query, { replacements });
          if (dupCodeRows && dupCodeRows.length > 0) {
            const existing = dupCodeRows[0];
            const name = existing.employee_name || existing.employeeName || `${existing.firstName || ''} ${existing.lastName || ''}`.trim() || 'Existing Employee';
            throw new ApiError(400, `Record already exists! An employee with Employee Code '${uniqueCodes[0]}' is already registered in the database (${name}, ID: #${existing.id.slice(0, 8)}). Duplicate entry not allowed.`);
          }
        }
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
  }
};

const checkDuplicateEmailInTable = checkDuplicateRecordInTable;

// Helper to format duplicate entry error messages appropriately for any table
const formatDuplicateEntryError = (err, tableName) => {
  const msg = err.message || '';
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('emp_code') || lowerMsg.includes('employeecode')) {
    return new ApiError(400, 'Employee Code already exists. Please use a unique Employee Code.');
  }
  if (lowerMsg.includes('branch_code') || lowerMsg.includes('branchcode')) {
    return new ApiError(400, 'Branch Code already exists. Please use a unique Branch Code.');
  }
  if (lowerMsg.includes('dept_code') || lowerMsg.includes('deptcode') || lowerMsg.includes('department_code')) {
    return new ApiError(400, 'Department Code already exists. Please use a unique Department Code.');
  }
  if (lowerMsg.includes('desig_code') || lowerMsg.includes('desigcode') || lowerMsg.includes('designation_code')) {
    return new ApiError(400, 'Designation Code already exists. Please use a unique Designation Code.');
  }
  if (lowerMsg.includes('company_code') || lowerMsg.includes('companycode')) {
    return new ApiError(400, 'Company Code already exists. Please use a unique Company Code.');
  }
  if (lowerMsg.includes('email') || lowerMsg.includes('company_email') || lowerMsg.includes('personal_email')) {
    return new ApiError(400, 'Email already exists. Please use a unique email address.');
  }
  const dupMatch = msg.match(/Duplicate entry '([^']+)' for key '([^']+)'/i);
  if (dupMatch) {
    const val = dupMatch[1];
    const keyParts = dupMatch[2].split('.');
    const keyName = (keyParts.length > 1 ? keyParts[1] : keyParts[0]).replace(/_/g, ' ');
    return new ApiError(400, `A record with this ${keyName} ('${val}') already exists. Please use a unique value.`);
  }
  return new ApiError(400, `Duplicate entry: A record with this value already exists in ${tableName}.`);
};

// POST: Insert a row into a table
const createTableRecord = asyncHandler(async (req, res) => {
  const tableName = validateTableName(req.params.tableName);
  const rawData = req.body;

  const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
  const userRoleStr = String(userRole || '').toLowerCase().trim();
  const isHrOrAdmin = await isHrOrAdminUser(req);

  if ((tableName === 'employees' || tableName === 'employee_profile') && userRoleStr === 'employee' && !isHrOrAdmin) {
    const rawEmail = String(rawData.email || rawData.company_email || rawData.companyEmail || rawData.personal_email || rawData.personalEmail || '').toLowerCase().trim();
    const userEmail = String(req.user.email || '').toLowerCase().trim();
    const isSelfRegistration = rawEmail && rawEmail === userEmail;
    if (!isSelfRegistration) {
      throw new ApiError(403, 'Access denied: Employees without HR permissions cannot register new employee profiles.');
    }
  }

  // Recruitment RBAC create validations
  const allRecruitmentTables = ['job_requisition', 'candidate_database', 'ats_applicant_tracking', 'job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (allRecruitmentTables.includes(tableName)) {
    if (userRoleStr === 'employee' && !isHrOrAdmin) {
      throw new ApiError(403, 'Access denied: Employees cannot create recruitment records.');
    }
    if (userRoleStr === 'manager') {
      if (['offer_letters', 'onboarding_tasks', 'joining_records', 'candidate_database'].includes(tableName)) {
        throw new ApiError(403, 'Access denied: Department Heads cannot perform this operation.');
      }
      
      const [empProfile] = await req.tenantDb.query(
        "SELECT department, department_id FROM employees WHERE LOWER(email) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim()], type: QueryTypes.SELECT }
      ).catch(() => [null]);
      const managerDept = empProfile ? empProfile.department : null;
      const managerDeptId = empProfile ? empProfile.department_id : null;

      if (tableName === 'job_requisition') {
        rawData.department = managerDept;
        rawData.departmentId = managerDeptId;
        rawData.department_id = managerDeptId;
        rawData.approvalStatus = 'Pending';
      } else if (tableName === 'job_postings' || tableName === 'job_posting') {
        rawData.department = managerDept;
        rawData.departmentId = managerDeptId;
        rawData.department_id = managerDeptId;
      }
    }
  }

  if (tableName === 'designation' || tableName === 'designations') {
    await provisionDesignationsTable(req.tenantDb);
  }

  if (tableName === 'business_unit' || tableName === 'business_units') {
    await provisionBusinessUnitsTable(req.tenantDb);
  }

  if (tableName === 'cost_center' || tableName === 'cost_centers') {
    await provisionCostCentersTable(req.tenantDb);
  }

  if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
    await provisionReportingHierarchiesTable(req.tenantDb);
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    await provisionEmployeeTables(req.tenantDb);
    const empId = rawData.id;
    const managerId = rawData.managerId || rawData.manager_id;
    if (empId && managerId) {
      await checkCircularReporting(req.tenantDb, empId, managerId);
    }
  }

  if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
    const empId = rawData.employeeId || rawData.employee_id;
    const managerId = rawData.reportingManagerId || rawData.reporting_manager_id;
    if (empId && managerId) {
      await checkCircularReporting(req.tenantDb, empId, managerId);
    }
  }

  if (tableName === 'payroll_process') {
    await provisionPayrollTables(req.tenantDb);
  }

  if (tableName === 'expense_claims') {
    await provisionExpenseTables(req.tenantDb);
    if (!rawData.claim_number) {
      rawData.claim_number = `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (!rawData.approval_status) {
      rawData.approval_status = 'Pending';
    }
    if (!rawData.reimbursement_status) {
      rawData.reimbursement_status = 'Pending';
    }
    if (!rawData.expense_date) {
      rawData.expense_date = new Date().toISOString().split('T')[0];
    }
    if (!rawData.employee_name && req.user) {
      rawData.employee_name = req.user.employeeName || req.user.name || req.user.email?.split('@')[0];
    }
    if (!rawData.employee_id && req.user) {
      rawData.employee_id = req.user.employee?.employeeCode || req.user.employeeCode || req.user.id || 'TVN2007';
    }
    if (!rawData.department && req.user) {
      rawData.department = req.user.departmentName || req.user.department || 'IT';
    }
  }

  const recruitmentTables = ['job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (recruitmentTables.includes(tableName)) {
    await provisionRecruitmentTables(req.tenantDb);
  }

  const leaveTables = ['leave_requests', 'leave_types', 'leave_type_masters', 'holiday', 'holidays', 'leave_transactions', 'leave_transaction', 'leave_type_master'];
  if (leaveTables.includes(tableName)) {
    await provisionLeaveTables(req.tenantDb);
    if (tableName === 'leave_requests') {
      if (!rawData.reqId) {
        rawData.reqId = `LRQ-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      if (!rawData.status) {
        rawData.status = 'PENDING';
      }
    }
  }

  const performanceTables = ['performance_masters', 'performance_goals', 'performance_appraisals', 'performance_feedback_360', 'performance_pips', 'performance_recommendations', 'performance_ratings', 'performance_competencies', 'performance_development_plans'];
  if (performanceTables.includes(tableName)) {
    await provisionPerformanceTables(req.tenantDb);
  }

  const learningTables = ['learning_dashboard', 'learning_dashboards', 'courses', 'lms_progress', 'training_records', 'skill_development', 'certification_tracking', 'training_feedback'];
  if (learningTables.includes(tableName)) {
    await provisionLearningTables(req.tenantDb);
  }

  const documentTables = ['document_types', 'document_templates', 'documents', 'document_versions', 'document_approvals', 'document_assignments', 'document_acknowledgements', 'document_signatures', 'document_verifications', 'document_access_logs', 'document_expiry_reminders', 'document_field_values'];
  if (documentTables.includes(tableName)) {
    const { provisionDocumentTables } = require('../../services/core/document.provisioner');
    await provisionDocumentTables(req.tenantDb);
  }

  const exitTables = ['exit_requests', 'notice_periods', 'exit_clearances', 'asset_returns', 'no_dues', 'fnf_settlements', 'exit_interviews', 'experience_letters', 'exit_workflow_history'];
  if (exitTables.includes(tableName)) {
    const { provisionExitTables } = require('../../services/core/exit.provisioner');
    await provisionExitTables(req.tenantDb);
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    if (rawData.profile_data) {
      try {
        const parsedProfile = typeof rawData.profile_data === 'string'
          ? JSON.parse(rawData.profile_data)
          : rawData.profile_data;
        if (parsedProfile && typeof parsedProfile === 'object') {
          Object.keys(parsedProfile).forEach(key => {
            if (rawData[key] === undefined) {
              rawData[key] = parsedProfile[key];
            }
          });
        }
      } catch (err) {
        console.error("[table.controller] Error parsing profile_data for creation extraction:", err);
      }
    }
  }

  // Ensure employees always have a valid email
  if (tableName === 'employees' || tableName === 'employee_profile') {
    const existingEmail = [
      rawData.officialEmail,
      rawData.official_email,
      rawData.company_email,
      rawData.companyEmail,
      rawData.personal_email,
      rawData.personalEmail,
      rawData.email,
      rawData.hr_email,
      rawData.hrEmail
    ].find(e => e && String(e).trim() !== '');

    if (existingEmail) {
      rawData.email = rawData.email || existingEmail;
      rawData.officialEmail = rawData.officialEmail || existingEmail;
    } else {
      const cleanFirst = (rawData.first_name || rawData.firstName || rawData.employee_name || rawData.name || 'emp').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = (rawData.last_name || rawData.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueTag = Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
      const generatedEmail = `${cleanFirst}${cleanLast ? '.' + cleanLast : ''}${uniqueTag}@nib.com`;
      rawData.email = generatedEmail;
      rawData.company_email = generatedEmail;
      rawData.officialEmail = generatedEmail;
    }
  }

  // Check duplicate record (email or employee code) from database before insert
  await checkDuplicateRecordInTable(req, tableName, rawData);

  // If creating an employee record, automatically provision a matching User account
  if (tableName === 'employees' || tableName === 'employee_profile') {
    const userEmail = rawData.officialEmail || rawData.official_email || rawData.company_email || rawData.companyEmail || rawData.personal_email || rawData.personalEmail || rawData.email;
    if (userEmail) {
      try {
        const rawPassword = rawData.password || rawData.hr_password || rawData.hrPassword || 'securepassword';
        const hashedPassword = await require('bcryptjs').hash(rawPassword, 10);
        const userId = require('crypto').randomUUID();

        // 1. Get standard Employee role ID from tenant database (or fallback)
        const [roles] = await req.tenantDb.query(
          "SELECT id FROM roles WHERE LOWER(name) = 'employee' LIMIT 1",
          { type: QueryTypes.SELECT }
        ).catch(() => [null]);
        const roleId = roles ? roles.id : require('crypto').randomUUID();

        // 2. Insert into tenant database users table
        const [existingUser] = await req.tenantDb.query(
          "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
          { replacements: [userEmail.toLowerCase().trim()], type: QueryTypes.SELECT }
        ).catch(() => [null]);

        if (!existingUser) {
          await req.tenantDb.query(
            `INSERT INTO users (id, email, password, role_id, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, 'Active', NOW(), NOW())`,
            { replacements: [userId, userEmail.toLowerCase().trim(), hashedPassword, roleId] }
          );
          rawData.user_id = userId;
        } else {
          rawData.user_id = existingUser.id;
        }
      } catch (userErr) {
        console.warn('[table.controller] Skipped auto User creation:', userErr.message);
      }
    }
  }

  const formattedData = await sanitizeDataForTable(req.tenantDb, tableName, rawData);
  
  // Ensure created_at / updated_at are properly handled if columns exist in MySQL table
  try {
    const [cols] = await req.tenantDb.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const colNames = cols.map(c => c.Field);
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (colNames.includes('created_at')) {
      formattedData.created_at = formattedData.created_at || nowStr;
    } else {
      delete formattedData.created_at;
    }
    if (colNames.includes('updated_at')) {
      formattedData.updated_at = formattedData.updated_at || nowStr;
    } else {
      delete formattedData.updated_at;
    }
  } catch (e) {
    delete formattedData.created_at;
    delete formattedData.updated_at;
  }
  delete formattedData.createdAt;
  delete formattedData.updatedAt;
  delete formattedData.deleted_at;
  delete formattedData.deletedAt;

  // Create UUID for ID field if missing, but skip if it is an auto-increment or integer column
  try {
    const colResults = await req.tenantDb.query(
      `SHOW COLUMNS FROM \`${tableName}\` WHERE Field = 'id'`,
      { type: require('sequelize').QueryTypes.SELECT }
    );
    const isAutoIncrement = colResults && colResults.some(c => 
      String(c.Extra || '').toLowerCase().includes('auto_increment') ||
      String(c.Type || '').toLowerCase().startsWith('int')
    );
    if (isAutoIncrement) {
      delete formattedData.id;
    } else if (!formattedData.id) {
      formattedData.id = require('crypto').randomUUID();
    }
  } catch (errCol) {
    if (!formattedData.id) {
      formattedData.id = require('crypto').randomUUID();
    }
  }

  const keys = Object.keys(formattedData);
  const columns = keys.map(key => `\`${key}\``).join(', ');
  const placeholders = keys.map(key => `:${key}`).join(', ');

  try {
    await req.tenantDb.query(
      `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
      { replacements: formattedData }
    );
    if (tableName === 'employees' || tableName === 'employee_profile') {
      const sisterTable = tableName === 'employees' ? 'employee_profile' : 'employees';
      await req.tenantDb.query(
        `INSERT INTO \`${sisterTable}\` (${columns}) VALUES (${placeholders})`,
        { replacements: formattedData }
      ).catch(() => {});
    }
    if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
      const empId = formattedData.employee_id || formattedData.employeeId;
      const managerId = formattedData.reporting_manager_id || formattedData.reportingManagerId;
      if (empId) {
        await req.tenantDb.query(
          "UPDATE employees SET manager_id = ? WHERE id = ?",
          { replacements: [managerId || null, empId] }
        ).catch(() => {});
        await req.tenantDb.query(
          "UPDATE employee_profile SET manager_id = ? WHERE id = ?",
          { replacements: [managerId || null, empId] }
        ).catch(() => {});
      }
    }
  } catch (insertErr) {
    if (insertErr instanceof ApiError) throw insertErr;
    if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.message.includes('Duplicate entry') || insertErr.name === 'SequelizeUniqueConstraintError') {
      throw formatDuplicateEntryError(insertErr, tableName);
    }
    if (insertErr.message && (insertErr.message.includes("Field '") && insertErr.message.includes("doesn't have a default value") || insertErr.code === 'ER_NO_DEFAULT_FOR_FIELD')) {
      const match = insertErr.message.match(/Field '([^']+)' doesn't have a default value/);
      if (match && match[1]) {
        const missingField = match[1];
        console.warn(`[Auto-Fix Default Value] Modifying column ${tableName}.${missingField} to allow default value...`);
        if (missingField.includes('created') || missingField.includes('updated')) {
          await req.tenantDb.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${missingField}\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
        } else {
          await req.tenantDb.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${missingField}\` VARCHAR(255) NULL DEFAULT ''`).catch(() => {});
        }
        // Retry insertion
        await req.tenantDb.query(
          `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
          { replacements: formattedData }
        );
      } else {
        throw insertErr;
      }
    } else if (insertErr.message.includes("Table") && insertErr.message.includes("doesn't exist")) {
      console.warn(`[Self-Healing Table Provisioner] Table '${tableName}' missing in MySQL. Auto-provisioning DDL...`);

      const colDefinitions = keys.map(key => {
        if (key === 'id') return '`id` CHAR(36) NOT NULL PRIMARY KEY';
        if (key === 'created_at' || key === 'updated_at') return `\`${key}\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`;
        if (key === 'deleted_at') return '`deleted_at` TIMESTAMP NULL';
        const val = formattedData[key];
        if (typeof val === 'number') return `\`${key}\` DECIMAL(12,2) NULL`;
        if (typeof val === 'object') return `\`${key}\` JSON NULL`;
        if (String(val).length > 255) return `\`${key}\` TEXT NULL`;
        return `\`${key}\` VARCHAR(255) NULL`;
      }).join(', ');

      const createSql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (${colDefinitions}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
      await req.tenantDb.query(createSql);

      // Retry insertion into dynamically created table
      await req.tenantDb.query(
        `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
        { replacements: formattedData }
      );
    } else {
      throw insertErr;
    }
  }

  if (tableName === 'company') {
    if (!formattedData.id) {
      try {
        const [lastIdRows] = await req.tenantDb.query("SELECT LAST_INSERT_ID() as id");
        if (lastIdRows && lastIdRows[0] && lastIdRows[0].id) {
          formattedData.id = lastIdRows[0].id;
        }
      } catch (e) {}
    }
    // Sync to Master DB company registry
    try {
      const { masterSequelize } = require('../../config/database');
      const compCode = formattedData.companyCode || formattedData.company_code;
      const compName = formattedData.companyName || formattedData.company_name;
      if (compCode && compName) {
        await masterSequelize.query(`
          INSERT INTO company (companyCode, companyName, email, phone, gstNumber, panNumber, state, city, pincode, status)
          VALUES (:companyCode, :companyName, :email, :phone, :gstNumber, :panNumber, :state, :city, :pincode, :status)
          ON DUPLICATE KEY UPDATE
            companyName = VALUES(companyName),
            email = VALUES(email),
            phone = VALUES(phone),
            gstNumber = VALUES(gstNumber),
            panNumber = VALUES(panNumber),
            state = VALUES(state),
            city = VALUES(city),
            pincode = VALUES(pincode),
            status = VALUES(status)
        `, {
          replacements: {
            companyCode: compCode,
            companyName: compName,
            email: formattedData.email || '',
            phone: formattedData.phone || '',
            gstNumber: formattedData.gstNumber || formattedData.gst_number || '',
            panNumber: formattedData.panNumber || formattedData.pan_number || '',
            state: formattedData.state || '',
            city: formattedData.city || '',
            pincode: formattedData.pincode || '',
            status: formattedData.status || 'Active'
          }
        }).catch(e => console.warn('[Master Company Sync Notice]', e.message));
      }
    } catch (e) {}
  }

  res.status(201).json(new ApiResponse(201, formattedData, `Successfully created record in table: ${tableName}`));
});

// PUT: Update a row in a table by ID
const updateTableRecord = asyncHandler(async (req, res) => {
  const tableName = validateTableName(req.params.tableName);
  const { id } = req.params;
  let rawData = req.body;

  const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;

  // Recruitment RBAC update validations
  const userRoleStr = String(userRole || '').toLowerCase().trim();
  const isHrOrAdmin = await isHrOrAdminUser(req);
  const allRecruitmentTables = ['job_requisition', 'candidate_database', 'ats_applicant_tracking', 'job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (allRecruitmentTables.includes(tableName)) {
    if (userRoleStr === 'employee' && !isHrOrAdmin) {
      if (tableName === 'onboarding_tasks') {
        const [existingTask] = await req.tenantDb.query(
          `SELECT candidate_email FROM onboarding_tasks WHERE id = ? LIMIT 1`,
          { replacements: [id], type: QueryTypes.SELECT }
        ).catch(() => [null]);
        if (!existingTask || String(existingTask.candidate_email || '').toLowerCase().trim() !== req.user.email.toLowerCase().trim()) {
          throw new ApiError(403, 'Access denied: Employees can only update their own onboarding checklist.');
        }
      } else if (tableName === 'offer_letters') {
        const [existingOffer] = await req.tenantDb.query(
          `SELECT candidate_email FROM offer_letters WHERE id = ? LIMIT 1`,
          { replacements: [id], type: QueryTypes.SELECT }
        ).catch(() => [null]);
        if (!existingOffer || String(existingOffer.candidate_email || '').toLowerCase().trim() !== req.user.email.toLowerCase().trim()) {
          throw new ApiError(403, 'Access denied: Employees can only accept or reject their own offer letter.');
        }
      } else {
        throw new ApiError(403, 'Access denied: Employees cannot update recruitment records.');
      }
    }
    if (userRoleStr === 'manager') {
      if (['offer_letters', 'onboarding_tasks', 'joining_records', 'candidate_database'].includes(tableName)) {
        throw new ApiError(403, 'Access denied: Department Heads cannot perform this operation.');
      }
      
      const [empProfile] = await req.tenantDb.query(
        "SELECT department, department_id FROM employees WHERE LOWER(email) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim()], type: QueryTypes.SELECT }
      ).catch(() => [null]);
      const managerDept = empProfile ? empProfile.department : null;
      const managerDeptId = empProfile ? empProfile.department_id : null;

      if (tableName === 'job_requisition') {
        const [existing] = await req.tenantDb.query(`SELECT department, departmentId, department_id FROM job_requisition WHERE id = ? LIMIT 1`, { replacements: [id], type: QueryTypes.SELECT }).catch(() => [null]);
        if (!existing || String(existing.department || existing.departmentId || existing.department_id || '').toLowerCase() !== String(managerDept || managerDeptId || '').toLowerCase()) {
          throw new ApiError(403, 'Access denied: Department Heads can only update requisitions belonging to their department.');
        }
      } else if (tableName === 'job_postings' || tableName === 'job_posting') {
        const [existing] = await req.tenantDb.query(`SELECT department, departmentId, department_id FROM job_postings WHERE id = ? LIMIT 1`, { replacements: [id], type: QueryTypes.SELECT }).catch(() => [null]);
        if (!existing || String(existing.department || existing.departmentId || existing.department_id || '').toLowerCase() !== String(managerDept || managerDeptId || '').toLowerCase()) {
          throw new ApiError(403, 'Access denied: Department Heads can only update postings belonging to their department.');
        }
      }
    }
  }

  // 1. Enforce RBAC and check ownership if Employee
  if (tableName === 'designation' || tableName === 'designations') {
    await provisionDesignationsTable(req.tenantDb);
  }

  if (tableName === 'business_unit' || tableName === 'business_units') {
    await provisionBusinessUnitsTable(req.tenantDb);
  }

  if (tableName === 'cost_center' || tableName === 'cost_centers') {
    await provisionCostCentersTable(req.tenantDb);
  }

  if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
    await provisionReportingHierarchiesTable(req.tenantDb);
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    await provisionEmployeeTables(req.tenantDb);
    const empId = id || rawData.id;
    const managerId = rawData.managerId || rawData.manager_id;
    if (empId && managerId) {
      await checkCircularReporting(req.tenantDb, empId, managerId);
    }
  }

  if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
    const empId = rawData.employeeId || rawData.employee_id || id;
    const managerId = rawData.reportingManagerId || rawData.reporting_manager_id;
    if (empId && managerId) {
      await checkCircularReporting(req.tenantDb, empId, managerId);
    }
  }

  if (tableName === 'payroll_process') {
    await provisionPayrollTables(req.tenantDb);
  }

  if (tableName === 'expense_claims') {
    await provisionExpenseTables(req.tenantDb);
  }

  const recruitmentTables = ['job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (recruitmentTables.includes(tableName)) {
    await provisionRecruitmentTables(req.tenantDb);
  }

  const leaveTables = ['leave_requests', 'leave_types', 'leave_type_masters', 'holiday', 'holidays', 'leave_transactions', 'leave_transaction', 'leave_type_master'];
  if (leaveTables.includes(tableName)) {
    await provisionLeaveTables(req.tenantDb);
  }

  const performanceTables = ['performance_masters', 'performance_goals', 'performance_appraisals', 'performance_feedback_360', 'performance_pips', 'performance_recommendations', 'performance_ratings', 'performance_competencies', 'performance_development_plans'];
  if (performanceTables.includes(tableName)) {
    await provisionPerformanceTables(req.tenantDb);
  }

  const learningTables = ['learning_dashboard', 'learning_dashboards', 'courses', 'lms_progress', 'training_records', 'skill_development', 'certification_tracking', 'training_feedback'];
  if (learningTables.includes(tableName)) {
    await provisionLearningTables(req.tenantDb);
  }

  if (tableName === 'employees' || tableName === 'employee_profile') {
    const [existingEmp] = await req.tenantDb.query(
      `SELECT id, email, user_id, profileStatus, profileCompletion FROM \`${tableName}\` WHERE id = ? LIMIT 1`,
      { replacements: [id], type: QueryTypes.SELECT }
    ).catch(() => [null]);

    if (existingEmp) {
      const isSelf = (existingEmp.user_id === req.user.id) || 
                     (existingEmp.email && existingEmp.email.toLowerCase() === req.user.email.toLowerCase());
      const isHrOrAdmin = await isHrOrAdminUser(req);
      if (userRole === 'Employee' && !isSelf && !isHrOrAdmin) {
        throw new ApiError(403, 'Access denied: Employees cannot modify other employees\' profiles.');
      }

      // Extract new profile_data keys into rawData directly for saving to individual columns
      let newProfileData = {};
      try {
        if (rawData.profile_data) {
          newProfileData = typeof rawData.profile_data === 'string' ? JSON.parse(rawData.profile_data) : rawData.profile_data;
        }
      } catch (err) {}

      Object.keys(newProfileData).forEach(key => {
        if (rawData[key] === undefined) {
          rawData[key] = newProfileData[key];
        }
      });

      // Preserve status & completion if they are not explicitly being updated
      if (rawData.profileStatus === undefined && existingEmp.profileStatus) {
        rawData.profileStatus = existingEmp.profileStatus;
      }
      if (rawData.profileCompletion === undefined && existingEmp.profileCompletion !== null && existingEmp.profileCompletion !== undefined) {
        rawData.profileCompletion = existingEmp.profileCompletion;
      }
    }
  }

  if (tableName === 'leave_requests') {
    const [prevRecord] = await req.tenantDb.query(
      `SELECT * FROM \`leave_requests\` WHERE id = ? LIMIT 1`,
      { replacements: [id], type: QueryTypes.SELECT }
    ).catch(() => [null]);

    if (prevRecord && prevRecord.status !== rawData.status) {
      if (rawData.status === 'Approved') {
        const employeeIdentifier = prevRecord.employeeId || prevRecord.employee_id;
        const [emp] = await req.tenantDb.query(
          `SELECT id, firstName, lastName, employeeCode, user_id, casualLeave, sickLeave, earnedLeave FROM \`employees\` WHERE id = ? OR employeeId = ? OR employeeCode = ? LIMIT 1`,
          { replacements: [employeeIdentifier, employeeIdentifier, employeeIdentifier], type: QueryTypes.SELECT }
        ).catch(() => [null]);

        if (emp) {
          const leaveType = String(prevRecord.leaveType || '').toLowerCase();
          let balanceCol = null;
          let currentBalance = 0;

          if (leaveType.includes('casual')) {
            balanceCol = 'casualLeave';
            currentBalance = parseFloat(emp.casualLeave) || 0;
          } else if (leaveType.includes('sick') || leaveType.includes('medical')) {
            balanceCol = 'sickLeave';
            currentBalance = parseFloat(emp.sickLeave) || 0;
          } else if (leaveType.includes('earned') || leaveType.includes('privilege')) {
            balanceCol = 'earnedLeave';
            currentBalance = parseFloat(emp.earnedLeave) || 0;
          }

          const deductionDays = parseFloat(prevRecord.totalDays) || 0;

          if (balanceCol) {
            const nextBalance = Math.max(0, currentBalance - deductionDays);
            await req.tenantDb.query(
              `UPDATE \`employees\` SET \`${balanceCol}\` = ? WHERE \`id\` = ?`,
              { replacements: [String(nextBalance), emp.id] }
            ).catch(() => {});
            await req.tenantDb.query(
              `UPDATE \`employee_profile\` SET \`${balanceCol}\` = ? WHERE \`id\` = ?`,
              { replacements: [String(nextBalance), emp.id] }
            ).catch(() => {});
          }

          // Create a leave transaction
          const crypto = require('crypto');
          const txUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          await req.tenantDb.query(
            `INSERT INTO \`leave_transactions\` (id, employee_id, leave_type, transaction_type, days, description) VALUES (?, ?, ?, 'Debit', ?, ?)`,
            { replacements: [txUuid, emp.employeeCode || emp.id, prevRecord.leaveType, deductionDays, `Approved leave from ${prevRecord.fromDate} to ${prevRecord.toDate}`] }
          ).catch(() => {});

          // Update applicable attendance dates as LEAVE
          const start = new Date(prevRecord.fromDate);
          const end = new Date(prevRecord.toDate);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            const [att] = await req.tenantDb.query(
              `SELECT id FROM \`daily_attendance\` WHERE (employeeId = ? OR empId = ?) AND \`date\` = ? LIMIT 1`,
              { replacements: [emp.employeeCode || emp.id, emp.employeeCode || emp.id, dateStr], type: QueryTypes.SELECT }
            ).catch(() => [null]);

            if (att) {
              await req.tenantDb.query(
                `UPDATE \`daily_attendance\` SET \`status\` = 'LEAVE', \`remarks\` = ? WHERE \`id\` = ?`,
                { replacements: [`Leave Approved: ${prevRecord.leaveType}`, att.id] }
              ).catch(() => {});
            } else {
              await req.tenantDb.query(
                `INSERT INTO \`daily_attendance\` (empId, employeeId, name, date, status, remarks) VALUES (?, ?, ?, ?, 'LEAVE', ?)`,
                { replacements: [emp.employeeCode || emp.id, 0, `${emp.firstName} ${emp.lastName || ''}`.trim(), dateStr, `Leave Approved: ${prevRecord.leaveType}`] }
              ).catch(() => {});
            }
          }

          // Notify employee
          const notifUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          await req.tenantDb.query(
            `INSERT INTO \`notifications\` (id, userId, title, message, status) VALUES (?, ?, ?, ?, 'Unread')`,
            { replacements: [notifUuid, emp.user_id || emp.id, 'Leave Request Approved', `Your request for ${prevRecord.leaveType} from ${prevRecord.fromDate} to ${prevRecord.toDate} has been approved.`] }
          ).catch(() => {});

          // Audit log
          const auditUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          await req.tenantDb.query(
            `INSERT INTO \`audit_logs\` (id, userId, username, action, details) VALUES (?, ?, ?, 'LEAVE_APPROVED', ?)`,
            { replacements: [auditUuid, req.user.id, req.user.username || 'Admin', `Approved leave request ID ${id} for employee ${emp.employeeCode}`] }
          ).catch(() => {});
        }
      } else if (rawData.status === 'Rejected') {
        const employeeIdentifier = prevRecord.employeeId || prevRecord.employee_id;
        const [emp] = await req.tenantDb.query(
          `SELECT id, user_id, employeeCode FROM \`employees\` WHERE id = ? OR employeeId = ? OR employeeCode = ? LIMIT 1`,
          { replacements: [employeeIdentifier, employeeIdentifier, employeeIdentifier], type: QueryTypes.SELECT }
        ).catch(() => [null]);

        if (emp) {
          const crypto = require('crypto');
          const reasonStr = rawData.rejectionReason || 'No reason provided';
          const notifUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          await req.tenantDb.query(
            `INSERT INTO \`notifications\` (id, userId, title, message, status) VALUES (?, ?, ?, ?, 'Unread')`,
            { replacements: [notifUuid, emp.user_id || emp.id, 'Leave Request Rejected', `Your request for ${prevRecord.leaveType} from ${prevRecord.fromDate} to ${prevRecord.toDate} has been rejected. Reason: ${reasonStr}`] }
          ).catch(() => {});

          const auditUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          await req.tenantDb.query(
            `INSERT INTO \`audit_logs\` (id, userId, username, action, details) VALUES (?, ?, ?, 'LEAVE_REJECTED', ?)`,
            { replacements: [auditUuid, req.user.id, req.user.username || 'Admin', `Rejected leave request ID ${id} for employee ${emp.employeeCode}. Reason: ${reasonStr}`] }
          ).catch(() => {});
        }
      }
    }
  }

  // Check duplicate record (email or employee code) from database before update
  await checkDuplicateRecordInTable(req, tableName, rawData, id);

  const formattedData = await sanitizeDataForTable(req.tenantDb, tableName, rawData);
  delete formattedData.id;
  delete formattedData.created_at;
  delete formattedData.updated_at;
  delete formattedData.createdAt;
  delete formattedData.updatedAt;
  delete formattedData.deleted_at;
  delete formattedData.deletedAt;

  if (Object.keys(formattedData).length === 0) {
    return res.status(200).json(new ApiResponse(200, { id }, `No columns to update in table: ${tableName}`));
  }

  const setClause = Object.keys(formattedData)
    .map(key => `\`${key}\` = :${key}`)
    .join(', ');

  try {
    if (tableName === 'lms_progress') {
      const [existingRow] = await req.tenantDb.query(
        `SELECT id FROM \`lms_progress\` WHERE \`id\` = ? LIMIT 1`,
        { replacements: [id], type: QueryTypes.SELECT }
      ).catch(() => [null]);

      if (!existingRow) {
        const columns = Object.keys(formattedData).map(key => `\`${key}\``).join(', ');
        const placeholders = Object.keys(formattedData).map(key => `:${key}`).join(', ');
        await req.tenantDb.query(
          `INSERT INTO \`lms_progress\` (\`id\`, ${columns}) VALUES (:id, ${placeholders})`,
          { replacements: { ...formattedData, id } }
        );
        await Promise.all([
          req.tenantDb.query(`DELETE FROM \`training_records\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`courses\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`certification_tracking\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {})
        ]);
      } else {
        await req.tenantDb.query(
          `UPDATE \`${tableName}\` SET ${setClause} WHERE \`id\` = :id`,
          { replacements: { ...formattedData, id } }
        );
      }
    } else if (tableName === 'performance_appraisals') {
      const [existingRow] = await req.tenantDb.query(
        `SELECT id FROM \`performance_appraisals\` WHERE \`id\` = ? LIMIT 1`,
        { replacements: [id], type: QueryTypes.SELECT }
      ).catch(() => [null]);

      if (!existingRow) {
        const columns = Object.keys(formattedData).map(key => `\`${key}\``).join(', ');
        const placeholders = Object.keys(formattedData).map(key => `:${key}`).join(', ');
        await req.tenantDb.query(
          `INSERT INTO \`performance_appraisals\` (\`id\`, ${columns}) VALUES (:id, ${placeholders})`,
          { replacements: { ...formattedData, id } }
        );
        await Promise.all([
          req.tenantDb.query(`DELETE FROM \`performance_masters\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_goals\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_feedback_360\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_competencies\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_ratings\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_development_plans\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_pips\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {}),
          req.tenantDb.query(`DELETE FROM \`performance_recommendations\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {})
        ]);
      } else {
        await req.tenantDb.query(
          `UPDATE \`${tableName}\` SET ${setClause} WHERE \`id\` = :id`,
          { replacements: { ...formattedData, id } }
        );
      }
    } else {
      await req.tenantDb.query(
        `UPDATE \`${tableName}\` SET ${setClause} WHERE \`id\` = :id`,
        { replacements: { ...formattedData, id } }
      );
    }
    // Keep sister table updated
    if (tableName === 'employees' || tableName === 'employee_profile') {
      const sisterTable = tableName === 'employees' ? 'employee_profile' : 'employees';
      await req.tenantDb.query(
        `UPDATE \`${sisterTable}\` SET ${setClause} WHERE \`id\` = :id`,
        { replacements: { ...formattedData, id } }
      ).catch(() => {});
    }
    if (tableName === 'reporting_hierarchy' || tableName === 'reporting_hierarchies') {
      const empId = formattedData.employee_id || formattedData.employeeId;
      const managerId = formattedData.reporting_manager_id || formattedData.reportingManagerId;
      if (empId) {
        await req.tenantDb.query(
          "UPDATE employees SET manager_id = ? WHERE id = ?",
          { replacements: [managerId || null, empId] }
        ).catch(() => {});
        await req.tenantDb.query(
          "UPDATE employee_profile SET manager_id = ? WHERE id = ?",
          { replacements: [managerId || null, empId] }
        ).catch(() => {});
      }
    }
  } catch (updateErr) {
    if (updateErr instanceof ApiError) throw updateErr;
    if (updateErr.code === 'ER_DUP_ENTRY' || updateErr.message.includes('Duplicate entry') || updateErr.name === 'SequelizeUniqueConstraintError') {
      throw formatDuplicateEntryError(updateErr, tableName);
    }
    throw updateErr;
  }

  if (tableName === 'company') {
    try {
      const { masterSequelize } = require('../../config/database');
      const compCode = formattedData.companyCode || formattedData.company_code;
      const compName = formattedData.companyName || formattedData.company_name;
      if (compCode || compName) {
        await masterSequelize.query(`
          UPDATE company SET
            companyName = COALESCE(:companyName, companyName),
            email = COALESCE(:email, email),
            phone = COALESCE(:phone, phone),
            gstNumber = COALESCE(:gstNumber, gstNumber),
            panNumber = COALESCE(:panNumber, panNumber),
            state = COALESCE(:state, state),
            city = COALESCE(:city, city),
            pincode = COALESCE(:pincode, pincode),
            status = COALESCE(:status, status)
          WHERE companyCode = :compCode OR companyName = :compName
        `, {
          replacements: {
            compCode: compCode || '',
            compName: compName || '',
            companyName: compName || null,
            email: formattedData.email || null,
            phone: formattedData.phone || null,
            gstNumber: formattedData.gstNumber || formattedData.gst_number || null,
            panNumber: formattedData.panNumber || formattedData.pan_number || null,
            state: formattedData.state || null,
            city: formattedData.city || null,
            pincode: formattedData.pincode || null,
            status: formattedData.status || null
          }
        }).catch(e => console.warn('[Master Company Update Notice]', e.message));

        if (compName) {
          await masterSequelize.query(
            "UPDATE tenants SET company_name = ? WHERE db_name = ? OR id = ?",
            { replacements: [compName, req.companyCode?.toLowerCase() || '', req.companyCode || ''] }
          ).catch(() => {});
        }
      }
    } catch (e) {}
  }

  res.status(200).json(new ApiResponse(200, { id, ...formattedData }, `Successfully updated record in table: ${tableName}`));
});

// DELETE: Delete a row in a table by ID
const deleteTableRecord = asyncHandler(async (req, res) => {
  const tableName = validateTableName(req.params.tableName);
  const { id } = req.params;

  const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
  const userRoleStr = String(userRole || '').toLowerCase().trim();
  const isHrOrAdmin = await isHrOrAdminUser(req);

  if ((tableName === 'employees' || tableName === 'employee_profile') && userRoleStr === 'employee' && !isHrOrAdmin) {
    throw new ApiError(403, 'Access denied: Employees cannot delete employee records.');
  }

  // Recruitment RBAC delete validations
  const allRecruitmentTables = ['job_requisition', 'candidate_database', 'ats_applicant_tracking', 'job_postings', 'job_posting', 'interviews', 'offer_letters', 'onboarding_tasks', 'joining_records'];
  if (allRecruitmentTables.includes(tableName)) {
    if (userRoleStr === 'employee' && !isHrOrAdmin) {
      throw new ApiError(403, 'Access denied: Employees cannot delete recruitment records.');
    }
    if (userRoleStr === 'manager') {
      if (['offer_letters', 'onboarding_tasks', 'joining_records', 'candidate_database'].includes(tableName)) {
        throw new ApiError(403, 'Access denied: Department Heads cannot perform this operation.');
      }
      
      const [empProfile] = await req.tenantDb.query(
        "SELECT department, department_id FROM employees WHERE LOWER(email) = ? LIMIT 1",
        { replacements: [req.user.email.toLowerCase().trim()], type: QueryTypes.SELECT }
      ).catch(() => [null]);
      const managerDept = empProfile ? empProfile.department : null;
      const managerDeptId = empProfile ? empProfile.department_id : null;

      if (tableName === 'job_requisition') {
        const [existing] = await req.tenantDb.query(`SELECT department, departmentId, department_id FROM job_requisition WHERE id = ? LIMIT 1`, { replacements: [id], type: QueryTypes.SELECT }).catch(() => [null]);
        if (!existing || String(existing.department || existing.departmentId || existing.department_id || '').toLowerCase() !== String(managerDept || managerDeptId || '').toLowerCase()) {
          throw new ApiError(403, 'Access denied: Department Heads can only delete requisitions belonging to their department.');
        }
      } else if (tableName === 'job_postings' || tableName === 'job_posting') {
        const [existing] = await req.tenantDb.query(`SELECT department, departmentId, department_id FROM job_postings WHERE id = ? LIMIT 1`, { replacements: [id], type: QueryTypes.SELECT }).catch(() => [null]);
        if (!existing || String(existing.department || existing.departmentId || existing.department_id || '').toLowerCase() !== String(managerDept || managerDeptId || '').toLowerCase()) {
          throw new ApiError(403, 'Access denied: Department Heads can only delete postings belonging to their department.');
        }
      }
    }
  }

  let deptName = null;
  let deptHrEmail = null;
  if (tableName === 'department' || tableName === 'departments') {
    try {
      const [deptRows] = await req.tenantDb.query(
        `SELECT * FROM \`${tableName}\` WHERE \`id\` = ? LIMIT 1`,
        { replacements: [id] }
      );
      if (deptRows && deptRows.length > 0) {
        deptName = deptRows[0].deptName || deptRows[0].dept_name || deptRows[0].name;
        deptHrEmail = deptRows[0].hr_email || deptRows[0].hrEmail;
      }
    } catch (dErr) {}
  }

  // Execute direct SQL DELETE to permanently remove record from MySQL database
  await req.tenantDb.query(
    `DELETE FROM \`${tableName}\` WHERE \`id\` = ?`,
    { replacements: [id] }
  );

  // If department or departments, ensure full cross-table and master DB synchronization
  if (tableName === 'department' || tableName === 'departments') {
    const { masterSequelize } = require('../../config/database');
    const altTable = tableName === 'department' ? 'departments' : 'department';
    await req.tenantDb.query(`DELETE FROM \`${altTable}\` WHERE \`id\` = ?`, { replacements: [id] }).catch(() => {});

    if (masterSequelize) {
      await masterSequelize.query(`DELETE FROM departments WHERE id = ?`, { replacements: [id] }).catch(() => {});
      await masterSequelize.query(`DELETE FROM department WHERE id = ?`, { replacements: [id] }).catch(() => {});
    }

    if (deptHrEmail) {
      const cleanEmail = String(deptHrEmail).trim().toLowerCase();
      await req.tenantDb.query(`DELETE FROM departments WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
      await req.tenantDb.query(`DELETE FROM department WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
      await req.tenantDb.query(`DELETE FROM users WHERE LOWER(email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
      if (masterSequelize) {
        await masterSequelize.query(`DELETE FROM departments WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
        await masterSequelize.query(`DELETE FROM department WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
        await masterSequelize.query(`DELETE FROM users WHERE LOWER(email) = ?`, { replacements: [cleanEmail] }).catch(() => {});
      }
    }

    if (deptName) {
      try {
        let companyName = req.user?.companyName;
        const tenantId = req.headers['x-company-code'] || req.user?.companyCode;
        
        if (!companyName && tenantId && String(tenantId).toUpperCase() !== 'NIB') {
          const tenantRows = await masterSequelize.query(
            "SELECT company_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1",
            { 
              replacements: [tenantId, `nib_hr_${String(tenantId).toLowerCase()}`], 
              type: QueryTypes.SELECT 
            }
          );
          if (tenantRows && tenantRows.length > 0) {
            companyName = tenantRows[0].company_name;
          }
        }

        if (!companyName) {
          companyName = 'NIB';
        }

        const { deleteDepartmentFolder } = require('../../utils/companyFolderScaffolder');
        deleteDepartmentFolder(companyName, deptName);
      } catch (delErr) {
        console.warn('[Table Delete Department Folder Notice]', delErr.message);
      }
    }
  }

  res.status(200).json(new ApiResponse(200, null, `Successfully deleted record from table: ${tableName}`));
});

module.exports = {
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord
};
