// backend/models/finance/payrollDeduction.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollDeduction = sequelize.define('PayrollDeduction', {
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
  payrollItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payroll_item_id',
  },
  deductionCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'deduction_code',
  },
  deductionName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'deduction_name',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  deductionCategory: {
    type: DataTypes.STRING(100),
    defaultValue: 'Statutory',
    field: 'deduction_category',
  },
  calculatedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'calculated_amount',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  ruleSnapshot: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'rule_snapshot',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payroll_deductions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollDeduction;
