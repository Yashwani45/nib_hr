// backend/models/talent/performanceAppraisal.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PerformanceAppraisal = sequelize.define('PerformanceAppraisal', {
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
    allowNull: false,
    field: 'performance_master_id',
  },
  selfRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'self_rating',
  },
  managerRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'manager_rating',
  },
  hrRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'hr_rating',
  },
  finalRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'final_rating',
  },
  selfComment: {
    type: DataTypes.TEXT,
    field: 'self_comment',
  },
  managerComment: {
    type: DataTypes.TEXT,
    field: 'manager_comment',
  },
  hrComment: {
    type: DataTypes.TEXT,
    field: 'hr_comment',
  },
  strengths: {
    type: DataTypes.TEXT,
  },
  weaknesses: {
    type: DataTypes.TEXT,
  },
  achievements: {
    type: DataTypes.TEXT,
  },
  employeeAcknowledgement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'employee_acknowledgement',
  },
  employeeAcknowledgedAt: {
    type: DataTypes.DATE,
    field: 'employee_acknowledged_at',
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Manager_Reviewed', 'HR_Reviewed', 'Completed', 'Acknowledged'),
    defaultValue: 'Draft',
  },
  goalsSnapshot: {
    type: DataTypes.JSON,
    field: 'goals_snapshot',
  },
  kpisSnapshot: {
    type: DataTypes.JSON,
    field: 'kpis_snapshot',
  },
  competenciesSnapshot: {
    type: DataTypes.JSON,
    field: 'competencies_snapshot',
  },
}, {
  tableName: 'performance_appraisals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PerformanceAppraisal;
