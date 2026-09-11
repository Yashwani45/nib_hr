// backend/models/finance/payrollDeduction.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollDeduction = sequelize.define('PayrollDeduction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payrollItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payroll_item_id',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'payroll_deductions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollDeduction;
