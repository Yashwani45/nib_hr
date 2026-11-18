// backend/migrations/migrate_payroll_v2.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');

async function runPayrollMigration() {
  console.log('=== Starting Payroll Enterprise Schema Migration ===');

  const [dbs] = await sequelize.query('SHOW DATABASES');
  const validDbs = dbs
    .map(d => Object.values(d)[0])
    .filter(name => !['information_schema', 'performance_schema', 'mysql', 'sys', 'phpmyadmin'].includes(name));

  console.log(`Discovered ${validDbs.length} candidate databases to migrate:`, validDbs);

  for (const db of validDbs) {
    try {
      console.log(`\n>>> Migrating database: \`${db}\`...`);

      // 1. Table: salary_structures
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`salary_structures\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          structure_name VARCHAR(150) NULL,
          name VARCHAR(150) NULL,
          description TEXT NULL,
          pay_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly',
          currency VARCHAR(10) NOT NULL DEFAULT 'INR',
          department_id CHAR(36) NULL,
          designation_id CHAR(36) NULL,
          grade VARCHAR(50) NULL,
          employment_category VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          INDEX idx_struct_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] salary_structures create warning:`, e.message));

      const structCols = [
        "ALTER TABLE \`" + db + "\`.\`salary_structures\` ADD COLUMN structure_name VARCHAR(150) NULL",
        "ALTER TABLE \`" + db + "\`.\`salary_structures\` ADD COLUMN pay_frequency VARCHAR(50) NOT NULL DEFAULT 'Monthly'",
        "ALTER TABLE \`" + db + "\`.\`salary_structures\` ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'INR'",
        "ALTER TABLE \`" + db + "\`.\`salary_structures\` ADD COLUMN created_by VARCHAR(255) NULL",
        "UPDATE \`" + db + "\`.\`salary_structures\` SET structure_name = name WHERE structure_name IS NULL AND name IS NOT NULL"
      ];
      for (const q of structCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 2. Table: salary_components
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`salary_components\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          salary_structure_id CHAR(36) NOT NULL,
          component_code VARCHAR(100) NULL,
          component_name VARCHAR(100) NULL,
          name VARCHAR(100) NULL,
          component_type ENUM('Earning', 'Deduction') NULL,
          type ENUM('Earning', 'Deduction') NULL,
          calculation_type ENUM('Fixed', 'Percentage') NOT NULL DEFAULT 'Fixed',
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
          INDEX idx_comp_struct (salary_structure_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] salary_components create warning:`, e.message));

      const compCols = [
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN component_code VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN component_name VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN component_type ENUM('Earning', 'Deduction') NULL",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN percentage_base VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN is_taxable TINYINT(1) NOT NULL DEFAULT 1",
        "ALTER TABLE \`" + db + "\`.\`salary_components\` ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1",
        "UPDATE \`" + db + "\`.\`salary_components\` SET component_name = name WHERE component_name IS NULL AND name IS NOT NULL",
        "UPDATE \`" + db + "\`.\`salary_components\` SET component_type = type WHERE component_type IS NULL AND type IS NOT NULL",
        "UPDATE \`" + db + "\`.\`salary_components\` SET amount = value WHERE amount = 0.00 AND value != 0.00",
        "UPDATE \`" + db + "\`.\`salary_components\` SET percentage_base = reference_component WHERE percentage_base IS NULL AND reference_component IS NOT NULL"
      ];
      for (const q of compCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 3. Table: employee_salary_assignments
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`employee_salary_assignments\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          employee_id VARCHAR(255) NOT NULL,
          salary_structure_id CHAR(36) NOT NULL,
          effective_from DATE NOT NULL,
          effective_to DATE NULL,
          gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          base_gross DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          annual_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          status VARCHAR(50) NOT NULL DEFAULT 'Active',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          INDEX idx_esa_emp (employee_id),
          INDEX idx_esa_struct (salary_structure_id),
          INDEX idx_esa_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] employee_salary_assignments create warning:`, e.message));

      const assignCols = [
        "ALTER TABLE \`" + db + "\`.\`employee_salary_assignments\` ADD COLUMN gross_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`employee_salary_assignments\` ADD COLUMN annual_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`employee_salary_assignments\` ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active'",
        "ALTER TABLE \`" + db + "\`.\`employee_salary_assignments\` ADD COLUMN created_by VARCHAR(255) NULL",
        "ALTER TABLE \`" + db + "\`.\`employee_salary_assignments\` ADD COLUMN approved_by VARCHAR(255) NULL",
        "UPDATE \`" + db + "\`.\`employee_salary_assignments\` SET gross_salary = base_gross WHERE gross_salary = 0.00 AND base_gross != 0.00",
        "UPDATE \`" + db + "\`.\`employee_salary_assignments\` SET annual_ctc = ctc WHERE annual_ctc = 0.00 AND ctc != 0.00"
      ];
      for (const q of assignCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 4. Table: payroll_runs
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_runs\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_code VARCHAR(100) NULL,
          payroll_month VARCHAR(50) NULL,
          month VARCHAR(50) NULL,
          payroll_year INT NULL,
          year INT NULL,
          period_start DATE NULL,
          period_end DATE NULL,
          payment_date DATE NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'draft',
          total_employees INT NOT NULL DEFAULT 0,
          total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          processed_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          approved_at DATETIME NULL,
          locked_by VARCHAR(255) NULL,
          locked_at DATETIME NULL,
          payment_method VARCHAR(100) DEFAULT 'Bank Transfer',
          payment_reference VARCHAR(150) NULL,
          payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
          notes TEXT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_prun_period (payroll_year, payroll_month),
          INDEX idx_prun_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_runs create warning:`, e.message));

      const runCols = [
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN payroll_code VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN payroll_month VARCHAR(50) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN payroll_year INT NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN period_start DATE NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN period_end DATE NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN total_employees INT NOT NULL DEFAULT 0",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN total_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN total_net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`payroll_runs\` ADD COLUMN notes TEXT NULL",
        "UPDATE \`" + db + "\`.\`payroll_runs\` SET payroll_month = month WHERE payroll_month IS NULL AND month IS NOT NULL",
        "UPDATE \`" + db + "\`.\`payroll_runs\` SET payroll_year = year WHERE payroll_year IS NULL AND year IS NOT NULL",
        "UPDATE \`" + db + "\`.\`payroll_runs\` SET payroll_code = CONCAT('PR-', COALESCE(payroll_year, year, '2026'), '-', UPPER(LEFT(COALESCE(payroll_month, month, 'JAN'), 3)), '-', SUBSTRING(id, 1, 4)) WHERE payroll_code IS NULL"
      ];
      for (const q of runCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 5. Table: payroll_records (and payroll_items)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_records\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_run_id CHAR(36) NOT NULL,
          employee_id VARCHAR(255) NOT NULL,
          salary_assignment_id CHAR(36) NULL,
          attendance_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          payable_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          paid_leave_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          unpaid_leave_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          loss_of_pay_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          overtime_hours DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          overtime_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          gross_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          employer_pf DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          employer_esi DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_ctc DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          calculation_snapshot LONGTEXT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Calculated',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_prun_emp (payroll_run_id, employee_id),
          INDEX idx_prec_run (payroll_run_id),
          INDEX idx_prec_emp (employee_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_records create warning:`, e.message));

      // Also ensure payroll_items exists and is synchronized
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_items\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_run_id CHAR(36) NOT NULL,
          employee_id VARCHAR(255) NOT NULL,
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
          status VARCHAR(50) NOT NULL DEFAULT 'Draft',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pitem_run (payroll_run_id),
          INDEX idx_pitem_emp (employee_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_items create warning:`, e.message));

      // 6. Table: payroll_earnings
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_earnings\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_record_id CHAR(36) NULL,
          payroll_item_id CHAR(36) NULL,
          component_code VARCHAR(100) NULL,
          component_name VARCHAR(100) NULL,
          name VARCHAR(100) NULL,
          calculation_type VARCHAR(50) NOT NULL DEFAULT 'Fixed',
          calculated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          description TEXT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_pearn_rec (payroll_record_id),
          INDEX idx_pearn_item (payroll_item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_earnings create warning:`, e.message));

      const earnCols = [
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN payroll_record_id CHAR(36) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN component_code VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN component_name VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN calculation_type VARCHAR(50) NOT NULL DEFAULT 'Fixed'",
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN calculated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`payroll_earnings\` ADD COLUMN description TEXT NULL",
        "UPDATE \`" + db + "\`.\`payroll_earnings\` SET component_name = name WHERE component_name IS NULL AND name IS NOT NULL",
        "UPDATE \`" + db + "\`.\`payroll_earnings\` SET calculated_amount = amount WHERE calculated_amount = 0.00 AND amount != 0.00",
        "UPDATE \`" + db + "\`.\`payroll_earnings\` SET payroll_record_id = payroll_item_id WHERE payroll_record_id IS NULL AND payroll_item_id IS NOT NULL"
      ];
      for (const q of earnCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 7. Table: payroll_deductions
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_deductions\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_record_id CHAR(36) NULL,
          payroll_item_id CHAR(36) NULL,
          deduction_code VARCHAR(100) NULL,
          deduction_name VARCHAR(100) NULL,
          name VARCHAR(100) NULL,
          deduction_category VARCHAR(100) NOT NULL DEFAULT 'Statutory',
          calculated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          rule_snapshot LONGTEXT NULL,
          description TEXT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_pded_rec (payroll_record_id),
          INDEX idx_pded_item (payroll_item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_deductions create warning:`, e.message));

      const dedCols = [
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN payroll_record_id CHAR(36) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN deduction_code VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN deduction_name VARCHAR(100) NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN deduction_category VARCHAR(100) NOT NULL DEFAULT 'Statutory'",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN calculated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN rule_snapshot LONGTEXT NULL",
        "ALTER TABLE \`" + db + "\`.\`payroll_deductions\` ADD COLUMN description TEXT NULL",
        "UPDATE \`" + db + "\`.\`payroll_deductions\` SET deduction_name = name WHERE deduction_name IS NULL AND name IS NOT NULL",
        "UPDATE \`" + db + "\`.\`payroll_deductions\` SET calculated_amount = amount WHERE calculated_amount = 0.00 AND amount != 0.00",
        "UPDATE \`" + db + "\`.\`payroll_deductions\` SET payroll_record_id = payroll_item_id WHERE payroll_record_id IS NULL AND payroll_item_id IS NOT NULL"
      ];
      for (const q of dedCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 8. Table: employee_loans
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`employee_loans\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          employee_id VARCHAR(255) NOT NULL,
          loan_type VARCHAR(50) NOT NULL,
          principal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          requested_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          approved_amount DECIMAL(12, 2) NULL,
          interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          outstanding_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          installment_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          number_of_installments INT NOT NULL DEFAULT 12,
          tenure_months INT NOT NULL DEFAULT 12,
          start_date DATE NULL,
          end_date DATE NULL,
          reason TEXT NULL,
          remarks TEXT NULL,
          supporting_document VARCHAR(512) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          requested_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          approval_date DATE NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_eloan_emp (employee_id),
          INDEX idx_eloan_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] employee_loans create warning:`, e.message));

      const loanCols = [
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN principal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN installment_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN number_of_installments INT NOT NULL DEFAULT 12",
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN end_date DATE NULL",
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN requested_by VARCHAR(255) NULL",
        "ALTER TABLE \`" + db + "\`.\`employee_loans\` ADD COLUMN remarks TEXT NULL",
        "UPDATE \`" + db + "\`.\`employee_loans\` SET principal_amount = requested_amount WHERE principal_amount = 0.00 AND requested_amount != 0.00",
        "UPDATE \`" + db + "\`.\`employee_loans\` SET number_of_installments = tenure_months WHERE number_of_installments = 0 AND tenure_months != 0"
      ];
      for (const q of loanCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 9. Table: loan_repayments
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`loan_repayments\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          employee_loan_id CHAR(36) NULL,
          loan_id CHAR(36) NULL,
          payroll_record_id CHAR(36) NULL,
          payroll_item_id CHAR(36) NULL,
          emi_schedule_id CHAR(36) NULL,
          installment_number INT NOT NULL DEFAULT 1,
          due_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          outstanding_after_payment DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          payment_date DATE NULL,
          payment_mode VARCHAR(50) NOT NULL DEFAULT 'Payroll Deduction',
          status VARCHAR(50) NOT NULL DEFAULT 'deducted',
          remarks VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lrepay_loan (employee_loan_id),
          INDEX idx_lrepay_prec (payroll_record_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] loan_repayments create warning:`, e.message));

      const repayCols = [
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN employee_loan_id CHAR(36) NULL",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN payroll_record_id CHAR(36) NULL",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN installment_number INT NOT NULL DEFAULT 1",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN due_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN outstanding_after_payment DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        "ALTER TABLE \`" + db + "\`.\`loan_repayments\` ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'deducted'",
        "UPDATE \`" + db + "\`.\`loan_repayments\` SET employee_loan_id = loan_id WHERE employee_loan_id IS NULL AND loan_id IS NOT NULL",
        "UPDATE \`" + db + "\`.\`loan_repayments\` SET payroll_record_id = payroll_item_id WHERE payroll_record_id IS NULL AND payroll_item_id IS NOT NULL",
        "UPDATE \`" + db + "\`.\`loan_repayments\` SET paid_amount = amount WHERE paid_amount = 0.00 AND amount != 0.00"
      ];
      for (const q of repayCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 10. Table: statutory_configurations
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`statutory_configurations\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          rule_code VARCHAR(100) NOT NULL,
          rule_name VARCHAR(255) NOT NULL,
          applicable_region VARCHAR(100) NOT NULL DEFAULT 'All India',
          employee_category VARCHAR(100) NULL,
          employer_category VARCHAR(100) NULL,
          effective_from DATE NOT NULL,
          effective_to DATE NULL,
          employee_rate DECIMAL(5, 2) NULL,
          employer_rate DECIMAL(5, 2) NULL,
          wage_ceiling DECIMAL(12, 2) NULL,
          calculation_basis VARCHAR(100) NULL,
          minimum_amount DECIMAL(12, 2) NULL,
          maximum_amount DECIMAL(12, 2) NULL,
          configuration_json JSON NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_stat_rule_region_effective (rule_code, applicable_region, effective_from),
          INDEX idx_stat_region (applicable_region),
          INDEX idx_stat_active (is_active),
          INDEX idx_stat_effective_window (rule_code, is_active, effective_from, effective_to)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] statutory_configurations create warning:`, e.message));
      await sequelize.query(`ALTER TABLE \`${db}\`.\`statutory_configurations\` DROP INDEX uk_stat_rule_code`).catch(() => {});
      await sequelize.query(`ALTER TABLE \`${db}\`.\`statutory_configurations\` ADD UNIQUE INDEX uk_stat_rule_region_effective (rule_code, applicable_region, effective_from)`).catch(() => {});
      await sequelize.query(`ALTER TABLE \`${db}\`.\`statutory_configurations\` ADD INDEX idx_stat_effective_window (rule_code, is_active, effective_from, effective_to)`).catch(() => {});

      // 11. Table: payslips
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payslips\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_record_id CHAR(36) NULL,
          payroll_item_id CHAR(36) NULL,
          payslip_number VARCHAR(100) NULL,
          employee_id VARCHAR(255) NOT NULL,
          month VARCHAR(50) NOT NULL,
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
          other_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          gross_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          payable_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          lop_days DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          status VARCHAR(50) NOT NULL DEFAULT 'Generated',
          generated_by VARCHAR(255) NULL,
          generated_at DATETIME NULL,
          file_path VARCHAR(512) NULL,
          file_reference VARCHAR(512) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_pslip_prec (payroll_record_id),
          INDEX idx_pslip_emp (employee_id),
          INDEX idx_pslip_period (year, month)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payslips create warning:`, e.message));

      const pslipCols = [
        "ALTER TABLE \`" + db + "\`.\`payslips\` ADD COLUMN payroll_record_id CHAR(36) NULL",
        "ALTER TABLE \`" + db + "\`.\`payslips\` ADD COLUMN generated_at DATETIME NULL",
        "ALTER TABLE \`" + db + "\`.\`payslips\` ADD COLUMN generated_by VARCHAR(255) NULL",
        "ALTER TABLE \`" + db + "\`.\`payslips\` ADD COLUMN file_path VARCHAR(512) NULL",
        "ALTER TABLE \`" + db + "\`.\`payslips\` ADD COLUMN file_reference VARCHAR(512) NULL",
        "UPDATE \`" + db + "\`.\`payslips\` SET payroll_record_id = payroll_item_id WHERE payroll_record_id IS NULL AND payroll_item_id IS NOT NULL",
        "UPDATE \`" + db + "\`.\`payslips\` SET generated_at = created_at WHERE generated_at IS NULL"
      ];
      for (const q of pslipCols) {
        await sequelize.query(q).catch(() => {});
      }

      // 12. Table: payroll_payments
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_payments\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          payroll_record_id CHAR(36) NULL,
          payroll_run_id CHAR(36) NULL,
          employee_id VARCHAR(255) NULL,
          payment_reference VARCHAR(150) NULL,
          payment_method VARCHAR(100) NOT NULL DEFAULT 'Bank Transfer (NEFT/RTGS)',
          amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          payment_date DATE NULL,
          status ENUM('pending', 'processing', 'successful', 'failed', 'reversed') NOT NULL DEFAULT 'pending',
          external_transaction_id VARCHAR(150) NULL,
          failure_reason TEXT NULL,
          recorded_by VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ppay_rec (payroll_record_id),
          INDEX idx_ppay_run (payroll_run_id),
          INDEX idx_ppay_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_payments create warning:`, e.message));

      // 13. Table: payroll_audit_logs
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${db}\`.\`payroll_audit_logs\` (
          id CHAR(36) NOT NULL PRIMARY KEY,
          actor_user_id VARCHAR(255) NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          old_values JSON NULL,
          new_values JSON NULL,
          reason TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_palog_entity (entity_type, entity_id),
          INDEX idx_palog_actor (actor_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(e => console.warn(`[${db}] payroll_audit_logs create warning:`, e.message));

      // 14. Seed Reference Statutory Configurations
      const [existingStatRules] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${db}\`.\`statutory_configurations\``).catch(() => [[{ cnt: 0 }]]);
      if (existingStatRules && existingStatRules[0]?.cnt === 0) {
        console.log(`[${db}] Seeding official statutory configuration rules...`);
        const rules = [
          {
            id: 'stat-pf-001',
            rule_code: 'PF_STANDARD',
            rule_name: 'Employees Provident Fund (EPF & EPS)',
            applicable_region: 'All India',
            effective_from: '2020-01-01',
            employee_rate: 12.00,
            employer_rate: 12.00,
            wage_ceiling: 15000.00,
            calculation_basis: 'Basic + DA',
            configuration_json: JSON.stringify({
              epf_employee: 12.0,
              epf_employer: 3.67,
              eps_employer: 8.33,
              edli: 0.5,
              admin_charges: 0.5
            }),
            is_active: 1
          },
          {
            id: 'stat-esi-001',
            rule_code: 'ESI_DEFAULT',
            rule_name: 'Employee State Insurance (ESIC)',
            applicable_region: 'All India',
            effective_from: '2019-07-01',
            employee_rate: 0.75,
            employer_rate: 3.25,
            wage_ceiling: 21000.00,
            calculation_basis: 'Gross Wages',
            configuration_json: JSON.stringify({
              threshold: 21000,
              employee_contribution: 0.75,
              employer_contribution: 3.25
            }),
            is_active: 1
          },
          {
            id: 'stat-pt-mp-001',
            rule_code: 'PT_MADHYA_PRADESH',
            rule_name: 'Professional Tax - Madhya Pradesh',
            applicable_region: 'Madhya Pradesh',
            effective_from: '2018-04-01',
            calculation_basis: 'Monthly Gross Wages',
            configuration_json: JSON.stringify({
              slabs: [
                { min: 0, max: 18750, tax: 0 },
                { min: 18751, max: 25000, tax: 125 },
                { min: 25001, max: 99999999, tax: 208, marchTax: 212 }
              ]
            }),
            is_active: 1
          },
          {
            id: 'stat-pt-mh-001',
            rule_code: 'PT_MAHARASHTRA',
            rule_name: 'Professional Tax - Maharashtra',
            applicable_region: 'Maharashtra',
            effective_from: '2015-04-01',
            calculation_basis: 'Monthly Gross Wages',
            configuration_json: JSON.stringify({
              slabs: [
                { min: 0, max: 7500, tax: 0 },
                { min: 7501, max: 10000, tax: 175 },
                { min: 10001, max: 99999999, tax: 200, febTax: 300 }
              ]
            }),
            is_active: 1
          },
          {
            id: 'stat-tds-001',
            rule_code: 'TDS_SECTION_192',
            rule_name: 'TDS Salary Withholding (Section 192)',
            applicable_region: 'All India',
            effective_from: '2024-04-01',
            calculation_basis: 'Estimated Annual Taxable Income',
            configuration_json: JSON.stringify({
              regimes: ['New Tax Regime 115BAC', 'Old Tax Regime']
            }),
            is_active: 1
          }
        ];

        for (const r of rules) {
          await sequelize.query(`
            INSERT INTO \`${db}\`.\`statutory_configurations\`
            (id, rule_code, rule_name, applicable_region, effective_from, employee_rate, employer_rate, wage_ceiling, calculation_basis, configuration_json, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE updated_at = NOW()
          `, {
            replacements: [
              r.id, r.rule_code, r.rule_name, r.applicable_region, r.effective_from,
              r.employee_rate || null, r.employer_rate || null, r.wage_ceiling || null,
              r.calculation_basis || null, r.configuration_json, r.is_active
            ]
          }).catch(e => console.warn(`[${db}] Seed rule ${r.rule_code} warning:`, e.message));
        }
      }

      console.log(`[${db}] Successfully migrated all 12 payroll tables.`);
    } catch (dbErr) {
      console.error(`Failed to migrate database ${db}:`, dbErr.message);
    }
  }

  console.log('\n=== All Databases Successfully Migrated & Synchronized ===');
  process.exit(0);
}

runPayrollMigration();
