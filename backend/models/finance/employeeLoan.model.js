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
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  loanType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'loan_type',
  },
  requestedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
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
  tenureMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tenure_months',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  supportingDocument: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'supporting_document',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Closed'),
    defaultValue: 'Pending',
    allowNull: false,
  },
  outstandingBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'outstanding_balance',
  },
  totalPaid: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_paid',
  },
  approvedBy: {
    type: DataTypes.UUID,
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
