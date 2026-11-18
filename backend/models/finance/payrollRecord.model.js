// backend/models/finance/payrollRecord.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollRecord = sequelize.define('PayrollRecord', {
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
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'employee_id',
  },
  salaryAssignmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'salary_assignment_id',
  },
  attendanceDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'attendance_days',
  },
  payableDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'payable_days',
  },
  paidLeaveDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'paid_leave_days',
  },
  unpaidLeaveDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'unpaid_leave_days',
  },
  lossOfPayDays: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'loss_of_pay_days',
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
  grossEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'gross_earnings',
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
  totalCtc: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_ctc',
  },
  calculationSnapshot: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'calculation_snapshot',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Calculated',
    allowNull: false,
  },
}, {
  tableName: 'payroll_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollRecord;
