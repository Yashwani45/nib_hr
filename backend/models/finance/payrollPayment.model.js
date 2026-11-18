// backend/models/finance/payrollPayment.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollPayment = sequelize.define('PayrollPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payrollRecordId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_record_id',
  },
  payrollRunId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_run_id',
  },
  employeeId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'employee_id',
  },
  paymentReference: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'payment_reference',
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    defaultValue: 'Bank Transfer (NEFT/RTGS)',
    field: 'payment_method',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'payment_date',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'successful', 'failed', 'reversed'),
    defaultValue: 'pending',
    allowNull: false,
  },
  externalTransactionId: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'external_transaction_id',
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'failure_reason',
  },
  recordedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'recorded_by',
  },
}, {
  tableName: 'payroll_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollPayment;
