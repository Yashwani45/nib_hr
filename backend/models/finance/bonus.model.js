// backend/models/finance/bonus.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Bonus = sequelize.define('Bonus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bonusName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'bonus_name',
  },
  bonusType: {
    type: DataTypes.ENUM('Performance', 'Festival/Diwali', 'Annual Statutory', 'Project Milestone', 'Retention'),
    defaultValue: 'Performance',
    field: 'bonus_type',
  },
  calculationType: {
    type: DataTypes.ENUM('Fixed Amount', 'Percentage of Basic', 'Percentage of CTC'),
    defaultValue: 'Fixed Amount',
    field: 'calculation_type',
  },
  value: {
    type: DataTypes.FLOAT,
    defaultValue: 5000,
    field: 'value',
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'All Departments',
    field: 'department',
  },
  designation: {
    type: DataTypes.STRING,
    defaultValue: 'All Designations',
    field: 'designation',
  },
  payoutFrequency: {
    type: DataTypes.ENUM('Monthly', 'Quarterly', 'Bi-Annually', 'Annually', 'One-Time'),
    defaultValue: 'Annually',
    field: 'payout_frequency',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'bonus_masters',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Bonus;
