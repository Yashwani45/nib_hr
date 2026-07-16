// backend/models/index.js
const { sequelize } = require('../config/database');

const User = require('./core/user.model');
const Role = require('./core/role.model');
const Permission = require('./core/permission.model');
const Company = require('./core/company.model');
const Branch = require('./core/branch.model');
const Department = require('./core/department.model');
const Employee = require('./core/employee.model');

const Recruitment = require('./talent/recruitment.model');
const Candidate = require('./talent/candidate.model');
const Interview = require('./talent/interview.model');

const Attendance = require('./operations/attendance.model');
const Leave = require('./operations/leave.model');
const Shift = require('./operations/shift.model');
const Asset = require('./operations/asset.model');

const Payroll = require('./finance/payroll.model');
const Salary = require('./finance/salary.model');

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

// Support Domain
Employee.hasMany(Ticket, { foreignKey: 'employeeId', as: 'createdTickets', constraints: false });
Ticket.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });

Employee.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets', constraints: false });
Ticket.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignee', constraints: false });

Employee.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications', constraints: false });
Notification.belongsTo(Employee, { foreignKey: 'recipientId', as: 'recipient', constraints: false });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Company,
  Branch,
  Department,
  Employee,
  Recruitment,
  Candidate,
  Interview,
  Attendance,
  Leave,
  Shift,
  Asset,
  Payroll,
  Salary,
  Ticket,
  Notification,
  Survey,
};
