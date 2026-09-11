// backend/models/talent/performanceGoalHistory.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceGoalHistory = sequelize.define('PerformanceGoalHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  goalId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'goal_id',
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  comments: {
    type: DataTypes.TEXT,
  },
  supportingDocument: {
    type: DataTypes.STRING,
    field: 'supporting_document',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'updated_by',
  },
}, {
  tableName: 'performance_goal_histories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceGoalHistory;
