// backend/models/core/auditLog.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
  },
  roleName: {
    type: DataTypes.STRING,
  },
  actionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  moduleName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recordId: {
    type: DataTypes.STRING,
  },
  previousValues: {
    type: DataTypes.TEXT,
  },
  newValues: {
    type: DataTypes.TEXT,
  },
  httpMethod: {
    type: DataTypes.STRING,
  },
  apiEndpoint: {
    type: DataTypes.STRING,
  },
  requestBody: {
    type: DataTypes.TEXT,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  userAgent: {
    type: DataTypes.TEXT,
  },
  browser: {
    type: DataTypes.STRING,
  },
  device: {
    type: DataTypes.STRING,
  },
  os: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Success',
  },
  failureReason: {
    type: DataTypes.TEXT,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
});

module.exports = AuditLog;
