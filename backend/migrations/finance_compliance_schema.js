// backend/migrations/finance_compliance_schema.js
const { getTenantConnection } = require('../config/connectionManager');
const logger = require('../config/logger');

async function migrateTenant(tenantKey) {
  logger.info(`[Finance Migration] Running schema verification on tenant: ${tenantKey}`);
  const conn = await getTenantConnection(tenantKey);

  // 1. Ensure salary_structures table has all enterprise columns
  await conn.query(`
    CREATE TABLE IF NOT EXISTS salary_structures (
      id CHAR(36) NOT NULL PRIMARY KEY,
      structure_name VARCHAR(150) NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      pay_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly',
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      department_id CHAR(36) NULL,
      designation_id CHAR(36) NULL,
      department_ids JSON NULL,
      designation_ids JSON NULL,
      grade VARCHAR(50) NULL,
      reference_salary_type VARCHAR(50) NOT NULL DEFAULT 'Monthly Gross',
      effective_from DATE NULL,
      effective_to DATE NULL,
      employment_category VARCHAR(50) NULL DEFAULT 'Full-Time',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const structCols = [
    "ALTER TABLE salary_structures ADD COLUMN structure_name VARCHAR(150) NULL",
    "ALTER TABLE salary_structures ADD COLUMN pay_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly'",
    "ALTER TABLE salary_structures ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'INR'",
    "ALTER TABLE salary_structures ADD COLUMN created_by VARCHAR(255) NULL",
    "UPDATE salary_structures SET structure_name = name WHERE structure_name IS NULL AND name IS NOT NULL",
    "ALTER TABLE salary_structures ADD COLUMN department_id CHAR(36) NULL",
    "ALTER TABLE salary_structures ADD COLUMN designation_id CHAR(36) NULL",
    "ALTER TABLE salary_structures ADD COLUMN department_ids JSON NULL",
    "ALTER TABLE salary_structures ADD COLUMN designation_ids JSON NULL",
    "ALTER TABLE salary_structures ADD COLUMN grade VARCHAR(50) NULL",
    "ALTER TABLE salary_structures ADD COLUMN reference_salary_type VARCHAR(50) NOT NULL DEFAULT 'Monthly Gross'",
    "ALTER TABLE salary_structures ADD COLUMN effective_from DATE NULL",
    "ALTER TABLE salary_structures ADD COLUMN effective_to DATE NULL",
    "ALTER TABLE salary_structures ADD COLUMN employment_category VARCHAR(50) NULL DEFAULT 'Full-Time'",
    "ALTER TABLE salary_structures ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE salary_structures MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE salary_structures MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of structCols) {
    await conn.query(sql).catch(() => {});
  }

  // 2. Ensure salary_components table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS salary_components (
      id CHAR(36) NOT NULL PRIMARY KEY,
      salary_structure_id CHAR(36) NOT NULL,
      component_code VARCHAR(100) NULL,
      component_name VARCHAR(100) NULL,
      name VARCHAR(100) NOT NULL,
      component_type ENUM('Earning', 'Deduction') NULL,
      type ENUM('Earning', 'Deduction') NOT NULL,
      component_category VARCHAR(50) NOT NULL DEFAULT 'Earning',
      calculation_type ENUM('Fixed', 'Percentage', 'Formula') NOT NULL DEFAULT 'Fixed',
      calculation_base VARCHAR(100) NULL,
      formula VARCHAR(500) NULL,
      frequency VARCHAR(20) NOT NULL DEFAULT 'Monthly',
      minimum_amount DECIMAL(12, 2) NULL,
      maximum_amount DECIMAL(12, 2) NULL,
      eligibility_condition TEXT NULL,
      display_order INT NOT NULL DEFAULT 0,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      percentage_base VARCHAR(100) NULL,
      reference_component VARCHAR(100) NULL,
      is_taxable TINYINT(1) NOT NULL DEFAULT 1,
      is_statutory TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_struct_id (salary_structure_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  const componentCols = [
    "ALTER TABLE salary_components ADD COLUMN component_code VARCHAR(100) NULL",
    "ALTER TABLE salary_components ADD COLUMN component_name VARCHAR(100) NULL",
    "ALTER TABLE salary_components ADD COLUMN component_type ENUM('Earning', 'Deduction') NULL",
    "ALTER TABLE salary_components ADD COLUMN component_category VARCHAR(50) NOT NULL DEFAULT 'Earning'",
    "ALTER TABLE salary_components MODIFY COLUMN calculation_type ENUM('Fixed', 'Percentage', 'Formula') NOT NULL DEFAULT 'Fixed'",
    "ALTER TABLE salary_components ADD COLUMN calculation_base VARCHAR(100) NULL",
    "ALTER TABLE salary_components ADD COLUMN formula VARCHAR(500) NULL",
    "ALTER TABLE salary_components ADD COLUMN frequency VARCHAR(20) NOT NULL DEFAULT 'Monthly'",
    "ALTER TABLE salary_components ADD COLUMN minimum_amount DECIMAL(12, 2) NULL",
    "ALTER TABLE salary_components ADD COLUMN maximum_amount DECIMAL(12, 2) NULL",
    "ALTER TABLE salary_components ADD COLUMN eligibility_condition TEXT NULL",
    "ALTER TABLE salary_components ADD COLUMN display_order INT NOT NULL DEFAULT 0",
    "ALTER TABLE salary_components ADD COLUMN amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE salary_components ADD COLUMN percentage_base VARCHAR(100) NULL",
    "ALTER TABLE salary_components ADD COLUMN is_taxable TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE salary_components ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1",
    "UPDATE salary_components SET component_name = name WHERE component_name IS NULL AND name IS NOT NULL",
    "UPDATE salary_components SET component_type = type WHERE component_type IS NULL AND type IS NOT NULL",
    "UPDATE salary_components SET amount = value WHERE amount = 0.00 AND value != 0.00",
    "UPDATE salary_components SET percentage_base = reference_component WHERE percentage_base IS NULL AND reference_component IS NOT NULL",
    "UPDATE salary_components SET component_category = CASE WHEN type = 'Deduction' THEN 'Employee Deduction' ELSE component_category END WHERE component_category IS NULL OR component_category = '' OR (component_category = 'Earning' AND type = 'Deduction')"
  ];
  for (const sql of componentCols) {
    await conn.query(sql).catch(() => {});
  }
  await conn.query("ALTER TABLE salary_components ADD COLUMN is_statutory TINYINT(1) NOT NULL DEFAULT 0").catch(() => {});
  await conn.query("ALTER TABLE salary_components MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE salary_components MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 3. Ensure employee_salary_assignments table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS employee_salary_assignments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(255) NOT NULL,
      salary_structure_id CHAR(36) NOT NULL,
      effective_from DATE NOT NULL,
      effective_to DATE NULL,
      gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      base_gross DECIMAL(12, 2) NOT NULL,
      annual_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      ctc DECIMAL(12, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by VARCHAR(255) NULL,
      approved_by VARCHAR(255) NULL,
      revision_reason TEXT NULL,
      approval_status VARCHAR(50) NOT NULL DEFAULT 'Approved',
      component_overrides JSON NULL,
      salary_breakdown JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      INDEX idx_emp_id (employee_id),
      INDEX idx_struct_id (salary_structure_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  const assignmentCols = [
    "ALTER TABLE employee_salary_assignments ADD COLUMN gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE employee_salary_assignments ADD COLUMN annual_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE employee_salary_assignments ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active'",
    "ALTER TABLE employee_salary_assignments ADD COLUMN created_by VARCHAR(255) NULL",
    "ALTER TABLE employee_salary_assignments ADD COLUMN approved_by VARCHAR(255) NULL",
    "ALTER TABLE employee_salary_assignments ADD COLUMN revision_reason TEXT NULL",
    "ALTER TABLE employee_salary_assignments ADD COLUMN approval_status VARCHAR(50) NOT NULL DEFAULT 'Approved'",
    "ALTER TABLE employee_salary_assignments ADD COLUMN component_overrides JSON NULL",
    "ALTER TABLE employee_salary_assignments ADD COLUMN salary_breakdown JSON NULL",
    "UPDATE employee_salary_assignments SET gross_salary = base_gross WHERE gross_salary = 0.00 AND base_gross != 0.00",
    "UPDATE employee_salary_assignments SET annual_ctc = ctc WHERE annual_ctc = 0.00 AND ctc != 0.00"
  ];
  for (const sql of assignmentCols) {
    await conn.query(sql).catch(() => {});
  }
  await conn.query("ALTER TABLE employee_salary_assignments MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE employee_salary_assignments MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 4. Ensure payroll_runs table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id CHAR(36) NOT NULL PRIMARY KEY,
      month VARCHAR(20) NOT NULL,
      year INT NOT NULL,
      status ENUM('Draft', 'Pending_Approval', 'Approved', 'Processed', 'Locked', 'Cancelled') NOT NULL DEFAULT 'Draft',
      approved_by CHAR(36) NULL,
      processed_by CHAR(36) NULL,
      locked_by CHAR(36) NULL,
      approved_at DATETIME NULL,
      processed_at DATETIME NULL,
      locked_at DATETIME NULL,
      payment_date DATE NULL,
      payment_method VARCHAR(50) NULL DEFAULT 'Bank Transfer',
      payment_reference VARCHAR(150) NULL,
      payment_status ENUM('Unpaid', 'Pending', 'Partially_Paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_period (month, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const runCols = [
    "ALTER TABLE payroll_runs ADD COLUMN payment_date DATE NULL",
    "ALTER TABLE payroll_runs ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'Bank Transfer'",
    "ALTER TABLE payroll_runs ADD COLUMN payment_reference VARCHAR(150) NULL",
    "ALTER TABLE payroll_runs ADD COLUMN payment_status ENUM('Unpaid', 'Pending', 'Partially_Paid', 'Paid') NOT NULL DEFAULT 'Unpaid'",
    "ALTER TABLE payroll_runs MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE payroll_runs MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of runCols) {
    await conn.query(sql).catch(() => {});
  }

  // 5. Ensure payroll_items table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payroll_items (
      id CHAR(36) NOT NULL PRIMARY KEY,
      payroll_run_id CHAR(36) NOT NULL,
      employee_id CHAR(36) NOT NULL,
      working_days INT NOT NULL DEFAULT 0,
      present_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      absent_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      leave_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      lop_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      overtime_hours DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      overtime_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_allowances DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      employer_pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      employer_esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      status ENUM('Draft', 'Pending_Approval', 'Approved', 'Processed', 'Locked', 'Cancelled') NOT NULL DEFAULT 'Draft',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_run_id (payroll_run_id),
      INDEX idx_emp_id (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const itemCols = [
    "ALTER TABLE payroll_items ADD COLUMN employer_pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payroll_items ADD COLUMN employer_esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payroll_items ADD COLUMN total_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payroll_items MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE payroll_items MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of itemCols) {
    await conn.query(sql).catch(() => {});
  }

  // 6. Ensure payroll_earnings table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payroll_earnings (
      id CHAR(36) NOT NULL PRIMARY KEY,
      payroll_item_id CHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_item_id (payroll_item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE payroll_earnings MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE payroll_earnings MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 7. Ensure payroll_deductions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payroll_deductions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      payroll_item_id CHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_item_id (payroll_item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE payroll_deductions MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE payroll_deductions MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 8. Ensure payslips table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payslips (
      id CHAR(36) NOT NULL PRIMARY KEY,
      payslip_number VARCHAR(50) NULL,
      payroll_item_id CHAR(36) NULL,
      employee_id CHAR(36) NOT NULL,
      month VARCHAR(20) NOT NULL,
      year INT NOT NULL,
      basic DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      hra DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      conveyance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      medical DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      special DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      other_allowances DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      bonus DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      incentive DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      pt DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      tds DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      loan_deduction DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      employer_pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      employer_esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      working_days INT NOT NULL DEFAULT 0,
      paid_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      lop_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      payment_date DATE NULL,
      payment_status ENUM('Pending', 'Paid') NOT NULL DEFAULT 'Pending',
      payment_mode VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
      pdf_url VARCHAR(512) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_emp_period (employee_id, month, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const slipCols = [
    "ALTER TABLE payslips ADD COLUMN payslip_number VARCHAR(50) NULL",
    "ALTER TABLE payslips ADD COLUMN employer_pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payslips ADD COLUMN employer_esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payslips ADD COLUMN working_days INT NOT NULL DEFAULT 0",
    "ALTER TABLE payslips ADD COLUMN paid_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payslips ADD COLUMN lop_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00",
    "ALTER TABLE payslips MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE payslips MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of slipCols) {
    await conn.query(sql).catch(() => {});
  }

  // 9. Ensure employee_loans table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS employee_loans (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id CHAR(36) NOT NULL,
      loan_type VARCHAR(50) NOT NULL,
      requested_amount DECIMAL(12, 2) NOT NULL,
      approved_amount DECIMAL(12, 2) NULL,
      interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      tenure_months INT NOT NULL,
      reason TEXT NULL,
      supporting_document VARCHAR(512) NULL,
      start_date DATE NULL,
      status ENUM('Pending', 'Approved', 'Rejected', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Pending',
      outstanding_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      approved_by CHAR(36) NULL,
      approval_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_emp_loan (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE employee_loans MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Pending'").catch(() => {});
  await conn.query("ALTER TABLE employee_loans MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE employee_loans MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 10. Ensure loan_emi_schedules table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS loan_emi_schedules (
      id CHAR(36) NOT NULL PRIMARY KEY,
      loan_id CHAR(36) NOT NULL,
      installment_number INT NOT NULL,
      due_date DATE NOT NULL,
      emi_amount DECIMAL(12, 2) NOT NULL,
      principal_amount DECIMAL(12, 2) NOT NULL,
      interest_amount DECIMAL(12, 2) NOT NULL,
      status ENUM('Pending', 'Paid', 'Skipped') NOT NULL DEFAULT 'Pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_loan_sched (loan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE loan_emi_schedules MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE loan_emi_schedules MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 11. Ensure loan_repayments table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS loan_repayments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      loan_id CHAR(36) NOT NULL,
      payroll_item_id CHAR(36) NULL,
      emi_schedule_id CHAR(36) NULL,
      amount DECIMAL(12, 2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(50) NOT NULL DEFAULT 'Payroll Deduction',
      remarks VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_loan_repay (loan_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE loan_repayments ADD COLUMN remarks VARCHAR(255) NULL").catch(() => {});
  await conn.query("ALTER TABLE loan_repayments MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE loan_repayments MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 12. Ensure esi_contributions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS esi_contributions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id CHAR(36) NOT NULL,
      payroll_item_id CHAR(36) NOT NULL,
      esi_number VARCHAR(50) NULL,
      employee_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      employer_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      gross_wages DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      month VARCHAR(20) NOT NULL,
      year INT NOT NULL,
      status ENUM('Draft', 'Filed', 'Paid') NOT NULL DEFAULT 'Draft',
      challan_number VARCHAR(100) NULL,
      payment_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_esi_period (month, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const esiCols = [
    "ALTER TABLE esi_contributions ADD COLUMN status ENUM('Draft', 'Filed', 'Paid') NOT NULL DEFAULT 'Draft'",
    "ALTER TABLE esi_contributions ADD COLUMN challan_number VARCHAR(100) NULL",
    "ALTER TABLE esi_contributions ADD COLUMN payment_date DATE NULL",
    "ALTER TABLE esi_contributions MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE esi_contributions MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of esiCols) {
    await conn.query(sql).catch(() => {});
  }

  // 13. Ensure professional_tax_rules table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS professional_tax_rules (
      id CHAR(36) NOT NULL PRIMARY KEY,
      state VARCHAR(100) NOT NULL,
      min_salary DECIMAL(12, 2) NOT NULL,
      max_salary DECIMAL(12, 2) NOT NULL,
      tax_amount DECIMAL(12, 2) NOT NULL,
      effective_from DATE NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_state_salary (state, min_salary, max_salary)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query("ALTER TABLE professional_tax_rules MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
  await conn.query("ALTER TABLE professional_tax_rules MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});

  // 14. Ensure professional_tax_contributions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS professional_tax_contributions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id CHAR(36) NOT NULL,
      payroll_item_id CHAR(36) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pt_amount DECIMAL(12, 2) NOT NULL,
      month VARCHAR(20) NOT NULL,
      year INT NOT NULL,
      status ENUM('Draft', 'Filed', 'Paid') NOT NULL DEFAULT 'Draft',
      challan_number VARCHAR(100) NULL,
      payment_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pt_period (state, month, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const ptCols = [
    "ALTER TABLE professional_tax_contributions ADD COLUMN status ENUM('Draft', 'Filed', 'Paid') NOT NULL DEFAULT 'Draft'",
    "ALTER TABLE professional_tax_contributions ADD COLUMN challan_number VARCHAR(100) NULL",
    "ALTER TABLE professional_tax_contributions ADD COLUMN payment_date DATE NULL",
    "ALTER TABLE professional_tax_contributions MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE professional_tax_contributions MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];
  for (const sql of ptCols) {
    await conn.query(sql).catch(() => {});
  }

  // Seed default PT rules for Madhya Pradesh, Maharashtra, Karnataka, and Delhi if not present
  const [existingRules] = await conn.query("SELECT COUNT(*) as cnt FROM professional_tax_rules");
  if (existingRules[0].cnt === 0) {
    logger.info(`[Finance Migration] Seeding default statutory Professional Tax rules for ${tenantKey}`);
    const defaultPtRules = [
      // Madhya Pradesh (MP Official slabs: <= 18750: Nil, 18751-25000: 125, 25001-33333: 167, >33333: 208)
      { id: 'pt-mp-1', state: 'Madhya Pradesh', min_salary: 0, max_salary: 18750, tax_amount: 0, effective_from: '2024-04-01' },
      { id: 'pt-mp-2', state: 'Madhya Pradesh', min_salary: 18750.01, max_salary: 25000, tax_amount: 125, effective_from: '2024-04-01' },
      { id: 'pt-mp-3', state: 'Madhya Pradesh', min_salary: 25000.01, max_salary: 33333.33, tax_amount: 166.67, effective_from: '2024-04-01' },
      { id: 'pt-mp-4', state: 'Madhya Pradesh', min_salary: 33333.34, max_salary: 99999999.99, tax_amount: 208.33, effective_from: '2024-04-01' },

      // Maharashtra (Official slabs: <= 7500: Nil, 7501-10000: 175, > 10000: 200)
      { id: 'pt-mh-1', state: 'Maharashtra', min_salary: 0, max_salary: 7500, tax_amount: 0, effective_from: '2024-04-01' },
      { id: 'pt-mh-2', state: 'Maharashtra', min_salary: 7500.01, max_salary: 10000, tax_amount: 175, effective_from: '2024-04-01' },
      { id: 'pt-mh-3', state: 'Maharashtra', min_salary: 10000.01, max_salary: 99999999.99, tax_amount: 200, effective_from: '2024-04-01' },

      // Karnataka (Official slabs: < 25000: Nil, >= 25000: 200)
      { id: 'pt-ka-1', state: 'Karnataka', min_salary: 0, max_salary: 24999.99, tax_amount: 0, effective_from: '2024-04-01' },
      { id: 'pt-ka-2', state: 'Karnataka', min_salary: 25000, max_salary: 99999999.99, tax_amount: 200, effective_from: '2024-04-01' },

      // Delhi (No PT in Delhi)
      { id: 'pt-dl-1', state: 'Delhi', min_salary: 0, max_salary: 99999999.99, tax_amount: 0, effective_from: '2024-04-01' }
    ];

    for (const r of defaultPtRules) {
      await conn.query(
        `INSERT INTO professional_tax_rules (id, state, min_salary, max_salary, tax_amount, effective_from, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        { replacements: [r.id, r.state, r.min_salary, r.max_salary, r.tax_amount, r.effective_from] }
      );
    }
  }

  logger.info(`[Finance Migration] Schema migration verified for ${tenantKey}`);
}

async function runAllMigrations() {
  const tenants = ['nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic'];
  for (const t of tenants) {
    try {
      await migrateTenant(t);
    } catch (e) {
      logger.error(`Migration error on ${t}: ${e.message}`);
    }
  }
}

if (require.main === module) {
  runAllMigrations().then(() => {
    logger.info('All tenant finance migrations completed.');
    process.exit(0);
  }).catch(e => {
    logger.error('Fatal migration failure:', e);
    process.exit(1);
  });
}

module.exports = { migrateTenant, runAllMigrations };
