// backend/models/core/branch.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  branchCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company: DataTypes.STRING,
  companyId: DataTypes.INTEGER, // foreign key association
  branchType: DataTypes.STRING,
  address: DataTypes.STRING,
  country: DataTypes.STRING,
  state: DataTypes.STRING,
  city: DataTypes.STRING,
  district: DataTypes.STRING,
  pincode: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  manager: DataTypes.STRING,
  timezone: DataTypes.STRING,
  workingDays: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'branch',
  timestamps: false,
});

module.exports = Branch;
