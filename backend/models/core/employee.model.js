// backend/models/core/employee.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employee_name',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,

    unique: true,

  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  companyId: {
    type: DataTypes.UUID,
    field: 'company_id',
  },
  branchId: {
    type: DataTypes.UUID,
    field: 'branch_id',
  },
  departmentId: {
    type: DataTypes.UUID,
    field: 'department_id',
  },
  managerId: {
    type: DataTypes.UUID,
    field: 'manager_id',
  },
  designationId: {
    type: DataTypes.UUID,
    field: 'designation_id',
  },
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Employee;
