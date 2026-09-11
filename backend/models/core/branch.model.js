// backend/models/core/branch.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  branchCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'branch_code',
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'branch_name',
  },
  address: DataTypes.TEXT,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  country: DataTypes.STRING,
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'branches',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Branch;
