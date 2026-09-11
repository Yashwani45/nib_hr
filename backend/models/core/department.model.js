// backend/models/core/department.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    field: 'company_id',
  },
  branchId: {
    type: DataTypes.UUID,
    field: 'branch_id',
  },
  deptCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'dept_code',
  },
  deptName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'dept_name',
  },
  headEmployeeId: {
    type: DataTypes.UUID,
    field: 'head_employee_id',
  },
  parentDeptId: {
    type: DataTypes.UUID,
    field: 'parent_dept_id',
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
  },
  hrEmail: {
    type: DataTypes.STRING,
    field: 'hr_email',
  },
  hrPassword: {
    type: DataTypes.STRING,
    field: 'hr_password',
  },
  assignedModules: {
    type: DataTypes.JSON,
    field: 'assigned_modules',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'departments',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Department;
