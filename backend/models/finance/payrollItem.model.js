// backend/models/finance/payrollItem.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollItem = sequelize.define('PayrollItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payrollRunId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payroll_run_id',
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  workingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'working_days',
  },
  presentDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'present_days',
  },
  absentDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'absent_days',
  },
  leaveDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'leave_days',
  },
  lopDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'lop_days',
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'overtime_hours',
  },
  overtimeEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'overtime_earnings',
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'gross_salary',
  },
  totalAllowances: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'total_allowances',
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'total_deductions',
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'net_salary',
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending_Approval', 'Approved', 'Processed', 'Locked', 'Cancelled'),
    defaultValue: 'Draft',
    allowNull: false,
  },
}, {
  tableName: 'payroll_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollItem;
