// backend/models/talent/performanceGoal.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceGoal = sequelize.define('PerformanceGoal', {
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
  performanceMasterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'performance_master_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  target: {
    type: DataTypes.STRING,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium',
  },
  weightage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Approved', 'Rejected'),
    defaultValue: 'Not Started',
  },
  assignedBy: {
    type: DataTypes.UUID,
    field: 'assigned_by',
  },
  comments: {
    type: DataTypes.TEXT,
  },
  supportingDocument: {
    type: DataTypes.STRING,
    field: 'supporting_document',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date',
  },
}, {
  tableName: 'performance_goals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceGoal;
