const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'models', 'index.js');
let c = fs.readFileSync(filePath, 'utf8');

const target = 'module.exports = {';
const replacement = `// Route all models to dynamic tenant sequelize proxy
const allModels = [
  User, Role, Permission, Company, Branch, Department, Designation, Employee, AuditLog,
  Recruitment, Candidate, Interview, PerformanceMaster, PerformanceGoal, PerformanceGoalHistory,
  PerformanceKpi, PerformanceKpiHistory, PerformanceAppraisal, EmployeePromotion, EmployeeIncrement,
  RatingScale, Competency, Skill, GoalCategory, PerformanceImprovementPlan, Attendance, Leave,
  Shift, Asset, Holiday, LeaveType, Overtime, BiometricDeviceUser, BiometricAttendanceEvent,
  BiometricDevice, Payroll, Salary, Bonus, TdsMaster, SalaryStructure, SalaryComponent,
  EmployeeSalaryAssignment, PayrollRun, PayrollItem, PayrollEarning, PayrollDeduction, Payslip,
  EmployeeLoan, LoanRepayment, LoanEmiSchedule, EsiContribution, ProfessionalTaxRule,
  ProfessionalTaxContribution, PayrollRecord, StatutoryConfiguration, PayrollPayment,
  PayrollAuditLog, Ticket, Notification, Survey, NavigationMenu, DashboardWidget,
  OrgAttendanceConfig, OrgAttendanceMethod
];
allModels.forEach(m => {
  if (m && m.prototype) {
    m.sequelize = sequelize;
  }
});

module.exports = {`;

if (c.includes(target) && !c.includes('allModels.forEach')) {
  c = c.replace(target, replacement);
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('Successfully patched models/index.js');
} else {
  console.log('Already patched or target not found');
}
