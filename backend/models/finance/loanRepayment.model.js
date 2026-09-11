// backend/models/finance/loanRepayment.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const LoanRepayment = sequelize.define('LoanRepayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'loan_id',
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
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'payment_date',
  },
  paymentMode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Payroll Deduction',
    field: 'payment_mode',
  },
}, {
  tableName: 'loan_repayments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LoanRepayment;
