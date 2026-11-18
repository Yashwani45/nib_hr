// backend/scripts/update_models_index.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'models', 'index.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add imports if not present
if (!code.includes('PayrollRecord')) {
  const importTarget = "const ProfessionalTaxContribution = require('./finance/professionalTaxContribution.model');";
  const newImports = `${importTarget}
const PayrollRecord = require('./finance/payrollRecord.model');
const StatutoryConfiguration = require('./finance/statutoryConfiguration.model');
const PayrollPayment = require('./finance/payrollPayment.model');
const PayrollAuditLog = require('./finance/payrollAuditLog.model');`;

  code = code.replace(importTarget, newImports);
}

// 2. Add associations if not present
if (!code.includes('PayrollRecord.belongsTo(PayrollRun')) {
  const assocTarget = "Payslip.belongsTo(PayrollItem, { foreignKey: 'payrollItemId', as: 'payrollItem', constraints: false });";
  const newAssocs = `${assocTarget}

// Payroll Records (Enterprise Model) Associations
PayrollRun.hasMany(PayrollRecord, { foreignKey: 'payrollRunId', as: 'records', constraints: false });
PayrollRecord.belongsTo(PayrollRun, { foreignKey: 'payrollRunId', as: 'run', constraints: false });

Employee.hasMany(PayrollRecord, { foreignKey: 'employeeId', as: 'records', constraints: false });
PayrollRecord.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employeeDetails', constraints: false });

PayrollRecord.hasMany(PayrollEarning, { foreignKey: 'payrollRecordId', as: 'recordEarnings', constraints: false });
PayrollEarning.belongsTo(PayrollRecord, { foreignKey: 'payrollRecordId', as: 'record', constraints: false });

PayrollRecord.hasMany(PayrollDeduction, { foreignKey: 'payrollRecordId', as: 'recordDeductions', constraints: false });
PayrollDeduction.belongsTo(PayrollRecord, { foreignKey: 'payrollRecordId', as: 'record', constraints: false });

PayrollRecord.hasOne(Payslip, { foreignKey: 'payrollRecordId', as: 'recordPayslip', constraints: false });
Payslip.belongsTo(PayrollRecord, { foreignKey: 'payrollRecordId', as: 'recordDetails', constraints: false });

PayrollRecord.hasMany(PayrollPayment, { foreignKey: 'payrollRecordId', as: 'payments', constraints: false });
PayrollPayment.belongsTo(PayrollRecord, { foreignKey: 'payrollRecordId', as: 'record', constraints: false });

PayrollRun.hasMany(PayrollPayment, { foreignKey: 'payrollRunId', as: 'runPayments', constraints: false });
PayrollPayment.belongsTo(PayrollRun, { foreignKey: 'payrollRunId', as: 'run', constraints: false });

EmployeeLoan.hasMany(LoanRepayment, { foreignKey: 'employeeLoanId', as: 'repaymentLedger', constraints: false });
LoanRepayment.belongsTo(EmployeeLoan, { foreignKey: 'employeeLoanId', as: 'employeeLoan', constraints: false });`;

  code = code.replace(assocTarget, newAssocs);
}

// 3. Add exports if not present
if (!code.includes('PayrollAuditLog,')) {
  const exportTarget = "  ProfessionalTaxContribution,";
  const newExports = `${exportTarget}
  PayrollRecord,
  StatutoryConfiguration,
  PayrollPayment,
  PayrollAuditLog,`;

  code = code.replace(exportTarget, newExports);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated backend/models/index.js');
