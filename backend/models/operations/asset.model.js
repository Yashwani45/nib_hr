// backend/models/operations/asset.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  allocationId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  employee: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  empId: DataTypes.STRING,
  employeeId: DataTypes.INTEGER, // association helper
  assetCategory: DataTypes.STRING,
  assetName: DataTypes.STRING,
  assetCode: DataTypes.STRING,
  serialNumber: DataTypes.STRING,
  issueDate: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Assigned',
  },
}, {
  tableName: 'asset_allocation',
  timestamps: false,
});

module.exports = Asset;
