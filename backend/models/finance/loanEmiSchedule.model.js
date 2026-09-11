// backend/models/finance/loanEmiSchedule.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const LoanEmiSchedule = sequelize.define('LoanEmiSchedule', {
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
  installmentNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'installment_number',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date',
  },
  emiAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'emi_amount',
  },
  principalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'principal_amount',
  },
  interestAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'interest_amount',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Skipped'),
    defaultValue: 'Pending',
    allowNull: false,
  },
}, {
  tableName: 'loan_emi_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = LoanEmiSchedule;
