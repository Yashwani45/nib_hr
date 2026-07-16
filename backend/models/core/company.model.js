// backend/models/core/company.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  companyCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shortName: DataTypes.STRING,
  type: DataTypes.STRING,
  regNumber: DataTypes.STRING,
  cinNumber: DataTypes.STRING,
  panNumber: DataTypes.STRING,
  tanNumber: DataTypes.STRING,
  gstNumber: DataTypes.STRING,
  pfNumber: DataTypes.STRING,
  esiNumber: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  website: DataTypes.STRING,
  address1: DataTypes.STRING,
  address2: DataTypes.STRING,
  country: DataTypes.STRING,
  state: DataTypes.STRING,
  city: DataTypes.STRING,
  district: DataTypes.STRING,
  pincode: DataTypes.STRING,
  timezone: DataTypes.STRING,
  currency: DataTypes.STRING,
  financialYear: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'company',
  timestamps: false,
});

module.exports = Company;
