// backend/models/index.js
const { sequelize } = require('../config/database');

const User = require('./core/user.model');
const Role = require('./core/role.model');
const Permission = require('./core/permission.model');
const Company = require('./core/company.model');
const Branch = require('./core/branch.model');
const Department = require('./core/department.model');
const Employee = require('./core/employee.model');
const AuditLog = require('./core/auditLog.model');
const NavigationMenu = require('./core/navigationMenu.model');
const DashboardWidget = require('./core/dashboardWidget.model');
const Designation = require('./core/designation.model');

const Recruitment = require('./talent/recruitment.model');
const Candidate = require('./talent/candidate.model');
const Interview = require('./talent/interview.model');
const PerformanceMaster = require('./talent/performanceMaster.model');
const PerformanceGoal = require('./talent/performanceGoal.model');
const PerformanceGoalHistory = require('./talent/performanceGoalHistory.model');
const PerformanceKpi = require('./talent/performanceKpi.model');
const PerformanceKpiHistory = require('./talent/performanceKpiHistory.model');
const PerformanceAppraisal = require('./talent/performanceAppraisal.model');
const EmployeePromotion = require('./talent/employeePromotion.model');
const EmployeeIncrement = require('./talent/employeeIncrement.model');
const RatingScale = require('./talent/ratingScale.model');
const Competency = require('./talent/competency.model');
const Skill = require('./talent/skill.model');
const GoalCategory = require('./talent/goalCategory.model');
const PerformanceImprovementPlan = require('./talent/pip.model');

const Attendance = require('./operations/attendance.model');
const Leave = require('./operations/leave.model');
const Shift = require('./operations/shift.model');
const Asset = require('./operations/asset.model');
const Holiday = require('./operations/holiday.model');
const LeaveType = require('./operations/leaveType.model');
const Overtime = require('./operations/overtime.model');

const Payroll = require('./finance/payroll.model');
const Salary = require('./finance/salary.model');
const Bonus = require('./finance/bonus.model');
const TdsMaster = require('./finance/tdsMaster.model');

const SalaryStructure = require('./finance/salaryStructure.model');
const SalaryComponent = require('./finance/salaryComponent.model');
const EmployeeSalaryAssignment = require('./finance/employeeSalaryAssignment.model');
const PayrollRun = require('./finance/payrollRun.model');
const PayrollItem = require('./finance/payrollItem.model');
const PayrollEarning = require('./finance/payrollEarning.model');
const PayrollDeduction = require('./finance/payrollDeduction.model');
const Payslip = require('./finance/payslip.model');
const EmployeeLoan = require('./finance/employeeLoan.model');
const LoanRepayment = require('./finance/loanRepayment.model');
const LoanEmiSchedule = require('./finance/loanEmiSchedule.model');
const EsiContribution = require('./finance/esiContribution.model');
const ProfessionalTaxRule = require('./finance/professionalTaxRule.model');
const ProfessionalTaxContribution = require('./finance/professionalTaxContribution.model');

const Ticket = require('./support/ticket.model');
const Notification = require('./support/notification.model');
const Survey = require('./support/survey.model');

// ==================== ASSOCIATIONS ====================

// RBAC
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role', constraints: false });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users', constraints: false });

// Many-to-Many: Roles & Permissions (RolePermission join table)
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'roleId', as: 'assignedPermissions', constraints: false });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permissionId', as: 'roles', constraints: false });

// Organization Setup
Company.hasMany(Branch, { foreignKey: 'companyId', as: 'branches', constraints: false });
Branch.belongsTo(Company, { foreignKey: 'companyId', as: 'companyDetails', constraints: false });

Company.hasMany(Department, { foreignKey: 'companyId', as: 'departments', constraints: false });
Department.belongsTo(Company, { foreignKey: 'companyId', as: 'companyDetails', constraints: false });

Branch.hasMany(Department, { foreignKey: 'branchId', as: 'departments', constraints: false });
Department.belongsTo(Branch, { foreignKey: 'branchId', as: 'branchDetails', constraints: false });

Department.belongsTo(Department, { foreignKey: 'parentDeptId', as: 'parentDeptDetails', constraints: false });
Department.belongsTo(Employee, { foreignKey: 'headEmployeeId', as: 'headEmployeeDetails', constraints: false });

// Employee Relations
User.hasOne(Employee, { foreignKey: 'userId', as: 'employee', constraints: false });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

Company.hasMany(Employee, { foreignKey: 'companyId', as: 'employees', constraints: false });
Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'companyDetails', constraints: false });

Branch.hasMany(Employee, { foreignKey: 'branchId', as: 'employees', constraints: false });
Employee.belongsTo(Branch, { foreignKey: 'branchId', as: 'branchDetails', constraints: false });

Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees', constraints: false });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails', constraints: false });

Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'managerDetails', constraints: false });

// Talent Domain
Department.hasMany(Recruitment, { foreignKey: 'departmentId', as: 'recruitments', constraints: false });
Recruitment.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails', constraints: false });

Candidate.hasMany(Interview, { foreignKey: 'candidateId', as: 'interviews', constraints: false });
Interview.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'candidateDetails', constraints: false });

Recruitment.hasMany(Interview, { foreignKey: 'recruitmentId', as: 'interviews', constraints: false });
Interview.belongsTo(Recruitment, { foreignKey: 'recruitmentId', as: 'recruitment', constraints: false });

Employee.hasMany(Interview, { foreignKey: 'interviewerId', as: 'interviews', constraints: false });
Interview.belongsTo(Employee, { foreignKey: 'interviewerId', as: 'interviewer', constraints: false });

// Operations Domain
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances', constraints: false });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves', constraints: false });
Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(Asset, { foreignKey: 'employeeId', as: 'assets', constraints: false });
Asset.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employeeDetails', constraints: false });

// Finance Domain
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls', constraints: false });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasOne(Salary, { foreignKey: 'employeeId', as: 'salary', constraints: false });
Salary.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

// Salary Structure Associations
SalaryStructure.hasMany(SalaryComponent, { foreignKey: 'salaryStructureId', as: 'components', constraints: false });
SalaryComponent.belongsTo(SalaryStructure, { foreignKey: 'salaryStructureId', as: 'structure', constraints: false });

Employee.hasMany(EmployeeSalaryAssignment, { foreignKey: 'employeeId', as: 'salaryAssignments', constraints: false });
EmployeeSalaryAssignment.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

SalaryStructure.hasMany(EmployeeSalaryAssignment, { foreignKey: 'salaryStructureId', as: 'assignments', constraints: false });
EmployeeSalaryAssignment.belongsTo(SalaryStructure, { foreignKey: 'salaryStructureId', as: 'structure', constraints: false });

// Payroll Runs & Items Associations
PayrollRun.hasMany(PayrollItem, { foreignKey: 'payrollRunId', as: 'items', constraints: false });
PayrollItem.belongsTo(PayrollRun, { foreignKey: 'payrollRunId', as: 'run', constraints: false });

Employee.hasMany(PayrollItem, { foreignKey: 'employeeId', as: 'payrollItems', constraints: false });
PayrollItem.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

PayrollItem.hasMany(PayrollEarning, { foreignKey: 'payrollItemId', as: 'earnings', constraints: false });
PayrollEarning.belongsTo(PayrollItem, { foreignKey: 'payrollItemId', as: 'item', constraints: false });

PayrollItem.hasMany(PayrollDeduction, { foreignKey: 'payrollItemId', as: 'deductions', constraints: false });
PayrollDeduction.belongsTo(PayrollItem, { foreignKey: 'payrollItemId', as: 'item', constraints: false });

// Payslip Associations
Employee.hasMany(Payslip, { foreignKey: 'employeeId', as: 'payslips', constraints: false });
Payslip.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

// Loan Associations
Employee.hasMany(EmployeeLoan, { foreignKey: 'employeeId', as: 'loans', constraints: false });
EmployeeLoan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

EmployeeLoan.hasMany(LoanEmiSchedule, { foreignKey: 'loanId', as: 'emiSchedules', constraints: false });
LoanEmiSchedule.belongsTo(EmployeeLoan, { foreignKey: 'loanId', as: 'loan', constraints: false });

EmployeeLoan.hasMany(LoanRepayment, { foreignKey: 'loanId', as: 'repayments', constraints: false });
LoanRepayment.belongsTo(EmployeeLoan, { foreignKey: 'loanId', as: 'loan', constraints: false });

// Statutory Associations
Employee.hasMany(EsiContribution, { foreignKey: 'employeeId', as: 'esiContributions', constraints: false });
EsiContribution.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(ProfessionalTaxContribution, { foreignKey: 'employeeId', as: 'ptContributions', constraints: false });
ProfessionalTaxContribution.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

// Performance & Talent Associations
Employee.hasMany(PerformanceGoal, { foreignKey: 'employeeId', as: 'goals', constraints: false });
PerformanceGoal.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

PerformanceMaster.hasMany(PerformanceGoal, { foreignKey: 'performanceMasterId', as: 'goals', constraints: false });
PerformanceGoal.belongsTo(PerformanceMaster, { foreignKey: 'performanceMasterId', as: 'reviewCycle', constraints: false });

PerformanceGoal.hasMany(PerformanceGoalHistory, { foreignKey: 'goalId', as: 'progressHistory', constraints: false });
PerformanceGoalHistory.belongsTo(PerformanceGoal, { foreignKey: 'goalId', as: 'goal', constraints: false });

Employee.hasMany(PerformanceKpi, { foreignKey: 'employeeId', as: 'kpis', constraints: false });
PerformanceKpi.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Department.hasMany(PerformanceKpi, { foreignKey: 'departmentId', as: 'kpis', constraints: false });
PerformanceKpi.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails', constraints: false });

PerformanceMaster.hasMany(PerformanceKpi, { foreignKey: 'performanceMasterId', as: 'kpis', constraints: false });
PerformanceKpi.belongsTo(PerformanceMaster, { foreignKey: 'performanceMasterId', as: 'reviewCycle', constraints: false });

PerformanceKpi.hasMany(PerformanceKpiHistory, { foreignKey: 'kpiId', as: 'achievementHistory', constraints: false });
PerformanceKpiHistory.belongsTo(PerformanceKpi, { foreignKey: 'kpiId', as: 'kpi', constraints: false });

Employee.hasMany(PerformanceAppraisal, { foreignKey: 'employeeId', as: 'appraisals', constraints: false });
PerformanceAppraisal.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

PerformanceMaster.hasMany(PerformanceAppraisal, { foreignKey: 'performanceMasterId', as: 'appraisals', constraints: false });
PerformanceAppraisal.belongsTo(PerformanceMaster, { foreignKey: 'performanceMasterId', as: 'reviewCycle', constraints: false });

Employee.hasMany(EmployeePromotion, { foreignKey: 'employeeId', as: 'promotions', constraints: false });
EmployeePromotion.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Designation.hasMany(EmployeePromotion, { foreignKey: 'proposedDesignationId', as: 'proposedPromotions', constraints: false });
EmployeePromotion.belongsTo(Designation, { foreignKey: 'proposedDesignationId', as: 'proposedDesignation', constraints: false });

Employee.hasMany(EmployeeIncrement, { foreignKey: 'employeeId', as: 'increments', constraints: false });
EmployeeIncrement.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(PerformanceImprovementPlan, { foreignKey: 'employeeId', as: 'pips', constraints: false });
PerformanceImprovementPlan.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

// Support Domain
Employee.hasMany(Ticket, { foreignKey: 'employeeId', as: 'createdTickets', constraints: false });
Ticket.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets', constraints: false });
Ticket.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignee', constraints: false });

Employee.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications', constraints: false });
Notification.belongsTo(Employee, { foreignKey: 'recipientId', as: 'recipient', constraints: false });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', constraints: false });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

// Role mapping to navigation menus and widgets
Role.belongsToMany(NavigationMenu, { through: 'role_navigation_menus', foreignKey: 'roleId', as: 'navigationMenus', constraints: false });
NavigationMenu.belongsToMany(Role, { through: 'role_navigation_menus', foreignKey: 'menuId', as: 'roles', constraints: false });

Role.belongsToMany(DashboardWidget, { through: 'role_dashboard_widgets', foreignKey: 'roleId', as: 'dashboardWidgets', constraints: false });
DashboardWidget.belongsToMany(Role, { through: 'role_dashboard_widgets', foreignKey: 'widgetId', as: 'roles', constraints: false });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Company,
  Branch,
  Department,
  Designation,
  Employee,
  AuditLog,
  Recruitment,
  Candidate,
  Interview,
  PerformanceMaster,
  PerformanceGoal,
  PerformanceGoalHistory,
  PerformanceKpi,
  PerformanceKpiHistory,
  PerformanceAppraisal,
  EmployeePromotion,
  EmployeeIncrement,
  RatingScale,
  Competency,
  Skill,
  GoalCategory,
  PerformanceImprovementPlan,
  Attendance,
  Leave,
  Shift,
  Asset,
  Holiday,
  LeaveType,
  Overtime,
  Payroll,
  Salary,
  Bonus,
  TdsMaster,
  SalaryStructure,
  SalaryComponent,
  EmployeeSalaryAssignment,
  PayrollRun,
  PayrollItem,
  PayrollEarning,
  PayrollDeduction,
  Payslip,
  EmployeeLoan,
  LoanRepayment,
  LoanEmiSchedule,
  EsiContribution,
  ProfessionalTaxRule,
  ProfessionalTaxContribution,
  Ticket,
  Notification,
  Survey,
  NavigationMenu,
  DashboardWidget,
};
