// backend/models/finance/payslip.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payrollItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_item_id',
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  basic: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  hra: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  conveyance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  medical: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  special: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  otherAllowances: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'other_allowances',
  },
  bonus: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  incentive: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  pf: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  esi: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  pt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  tds: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  loanDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'loan_deduction',
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'gross_salary',
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_deductions',
  },
  netSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'net_salary',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'payment_date',
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid'),
    defaultValue: 'Pending',
    field: 'payment_status',
  },
  paymentMode: {
    type: DataTypes.STRING(50),
    defaultValue: 'Bank Transfer',
    field: 'payment_mode',
  },
  pdfUrl: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'pdf_url',
  },
}, {
  tableName: 'payslips',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Payslip;
