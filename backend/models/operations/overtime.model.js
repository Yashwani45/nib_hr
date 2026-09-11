// backend/models/operations/overtime.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Overtime = sequelize.define('Overtime', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  overtimeName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'overtime_name',
  },
  rateMultiplier: {
    type: DataTypes.FLOAT,
    defaultValue: 1.5,
    field: 'rate_multiplier',
  },
  minHours: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    field: 'min_hours',
  },
  maxHours: {
    type: DataTypes.FLOAT,
    defaultValue: 4.0,
    field: 'max_hours',
  },
  applicableDept: {
    type: DataTypes.STRING,
    defaultValue: 'All Departments',
    field: 'applicable_dept',
  },
  requiresManagerApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'requires_manager_approval',
  },
  requiresHrApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'requires_hr_approval',
  },
  payrollIntegrated: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'payroll_integrated',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'overtime_masters',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Overtime;
