// backend/models/finance/salary.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Salary = sequelize.define('Salary', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeId: DataTypes.INTEGER, // association helper
  basic: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  hra: DataTypes.DECIMAL(12, 2),
  da: DataTypes.DECIMAL(12, 2),
  special: DataTypes.DECIMAL(12, 2),
  conveyance: DataTypes.DECIMAL(12, 2),
  gross: DataTypes.DECIMAL(12, 2),
  pfDeduction: DataTypes.DECIMAL(12, 2),
  esiDeduction: DataTypes.DECIMAL(12, 2),
  pt: DataTypes.DECIMAL(12, 2),
  tds: DataTypes.DECIMAL(12, 2),
  netSalary: DataTypes.DECIMAL(12, 2),
}, {
  tableName: 'salary_structure',
  timestamps: false,
});

module.exports = Salary;
