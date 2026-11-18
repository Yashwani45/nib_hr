// backend/models/finance/payrollRun.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollRun = sequelize.define('PayrollRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payrollCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payroll_code',
  },
  payrollMonth: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'payroll_month',
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  payrollYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'payroll_year',
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'period_start',
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'period_end',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Draft',
    allowNull: false,
  },
  totalEmployees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_employees',
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_earnings',
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_deductions',
  },
  totalNetPay: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_net_pay',
  },
  approvedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'approved_by',
  },
  processedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'processed_by',
  },
  lockedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'locked_by',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at',
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_at',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'payment_date',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    defaultValue: 'Bank Transfer',
    field: 'payment_method',
  },
  paymentReference: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'payment_reference',
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'Unpaid',
    field: 'payment_status',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payroll_runs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollRun;
