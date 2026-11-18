// backend/models/finance/employeeLoan.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EmployeeLoan = sequelize.define('EmployeeLoan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'employee_id',
  },
  loanType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'loan_type',
  },
  principalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'principal_amount',
  },
  requestedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'requested_amount',
  },
  approvedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'approved_amount',
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'interest_rate',
  },
  outstandingBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'outstanding_balance',
  },
  installmentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'installment_amount',
  },
  numberOfInstallments: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    field: 'number_of_installments',
  },
  tenureMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    field: 'tenure_months',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  supportingDocument: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'supporting_document',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pending',
    allowNull: false,
  },
  totalPaid: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_paid',
  },
  requestedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'requested_by',
  },
  approvedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'approved_by',
  },
  approvalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'approval_date',
  },
}, {
  tableName: 'employee_loans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmployeeLoan;
