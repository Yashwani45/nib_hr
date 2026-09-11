// backend/models/talent/performanceKpiHistory.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceKpiHistory = sequelize.define('PerformanceKpiHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  kpiId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'kpi_id',
  },
  actualAchievement: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'actual_achievement',
  },
  recordedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'recorded_date',
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'updated_by',
  },
  remarks: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'performance_kpi_histories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceKpiHistory;
