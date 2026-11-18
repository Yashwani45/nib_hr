// backend/models/finance/payslip.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payslipNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payslip_number',
  },
  payrollRecordId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_record_id',
  },
  payrollItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_item_id',
  },
  employeeId: {
    type: DataTypes.STRING(255),
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
  otherDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'other_deductions',
  },
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'gross_salary',
  },
  grossEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'gross_earnings',
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
  employerPf: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'employer_pf',
  },
  employerEsi: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'employer_esi',
  },
  workingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'working_days',
  },
  paidDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'paid_days',
  },
  payableDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'payable_days',
  },
  lopDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'lop_days',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Generated',
  },
  generatedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'generated_by',
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'generated_at',
  },
  filePath: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'file_path',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'payment_date',
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
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
