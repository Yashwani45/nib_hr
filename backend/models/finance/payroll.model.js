// backend/models/finance/payroll.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  basicSalary: DataTypes.DECIMAL(12, 2),
  allowances: DataTypes.DECIMAL(12, 2),
  deductions: DataTypes.DECIMAL(12, 2),
  netPay: DataTypes.DECIMAL(12, 2),
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Draft',
  },
  paymentDate: DataTypes.STRING,
}, {
  tableName: 'payrolls',
  timestamps: false,
});

module.exports = Payroll;
