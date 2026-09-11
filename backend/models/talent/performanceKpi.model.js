// backend/models/talent/performanceKpi.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceKpi = sequelize.define('PerformanceKpi', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'employee_id',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id',
  },
  performanceMasterId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'performance_master_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.STRING,
  },
  target: {
    type: DataTypes.STRING,
  },
  measurementType: {
    type: DataTypes.STRING,
    field: 'measurement_type',
  },
  frequency: {
    type: DataTypes.ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Annual'),
    defaultValue: 'Annual',
  },
  weight: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  actualAchievement: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'actual_achievement',
  },
  calculatedScore: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'calculated_score',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Achieved', 'Missed'),
    defaultValue: 'Pending',
  },
}, {
  tableName: 'performance_kpis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceKpi;
