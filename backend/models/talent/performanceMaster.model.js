// backend/models/talent/performanceMaster.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceMaster = sequelize.define('PerformanceMaster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cycleName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'cycle_name',
  },
  reviewPeriod: {
    type: DataTypes.ENUM('Annual', 'Half-Yearly', 'Quarterly', 'Monthly'),
    defaultValue: 'Annual',
    field: 'review_period',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date',
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
  ratingScale: {
    type: DataTypes.STRING,
    defaultValue: '5-Point Scale (1: Low to 5: Outstanding)',
    field: 'rating_scale',
  },
  selfReviewWeight: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    field: 'self_review_weight',
  },
  managerReviewWeight: {
    type: DataTypes.INTEGER,
    defaultValue: 80,
    field: 'manager_review_weight',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Draft', 'Closed', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'performance_masters',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = PerformanceMaster;
