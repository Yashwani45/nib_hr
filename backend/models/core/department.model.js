// backend/models/core/department.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  deptCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  deptName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  head: DataTypes.STRING,
  parentDept: DataTypes.STRING,
  parentDeptId: DataTypes.INTEGER, // association helper
  company: DataTypes.STRING,
  companyId: DataTypes.INTEGER, // association helper
  branch: DataTypes.STRING,
  branchId: DataTypes.INTEGER, // association helper
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'department',
  timestamps: false,
});

module.exports = Department;
