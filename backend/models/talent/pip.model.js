// backend/models/talent/pip.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceImprovementPlan = sequelize.define('PerformanceImprovementPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  performanceIssues: {
    type: DataTypes.TEXT,
    field: 'performance_issues',
  },
  improvementObjectives: {
    type: DataTypes.TEXT,
    field: 'improvement_objectives',
  },
  actionItems: {
    type: DataTypes.TEXT,
    field: 'action_items',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date',
  },
  reviewFrequency: {
    type: DataTypes.STRING,
    field: 'review_frequency',
  },
  assignedManagerId: {
    type: DataTypes.UUID,
    field: 'assigned_manager_id',
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  outcome: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'Extended', 'Failed'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'performance_improvement_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceImprovementPlan;
