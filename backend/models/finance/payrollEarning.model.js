// backend/models/finance/payrollEarning.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollEarning = sequelize.define('PayrollEarning', {
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
  componentCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'component_code',
  },
  componentName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'component_name',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  calculationType: {
    type: DataTypes.STRING(50),
    defaultValue: 'Fixed',
    field: 'calculation_type',
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payroll_earnings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollEarning;
