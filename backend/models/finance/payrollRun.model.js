// backend/models/finance/payrollRun.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollRun = sequelize.define('PayrollRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending_Approval', 'Approved', 'Processed', 'Locked', 'Cancelled'),
    defaultValue: 'Draft',
    allowNull: false,
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by',
  },
  lockedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'locked_by',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at',
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_at',
  },
}, {
  tableName: 'payroll_runs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PayrollRun;
