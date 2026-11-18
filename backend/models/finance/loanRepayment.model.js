// backend/models/finance/loanRepayment.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const LoanRepayment = sequelize.define('LoanRepayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeLoanId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'employee_loan_id',
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'loan_id',
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
  emiScheduleId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'emi_schedule_id',
  },
  installmentNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'installment_number',
  },
  dueAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'due_amount',
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'paid_amount',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  outstandingAfterPayment: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'outstanding_after_payment',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'payment_date',
  },
  paymentMode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Payroll Deduction',
    field: 'payment_mode',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'deducted',
    allowNull: false,
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'loan_repayments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LoanRepayment;
