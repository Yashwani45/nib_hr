// backend/models/finance/payrollAuditLog.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PayrollAuditLog = sequelize.define('PayrollAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  actorUserId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'actor_user_id',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'entity_type',
  },
  entityId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'entity_id',
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'old_values',
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'new_values',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payroll_audit_logs',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = PayrollAuditLog;
