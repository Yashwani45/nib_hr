// backend/models/operations/leave.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reqId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  empName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeId: DataTypes.INTEGER, // association helper
  leaveType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  toDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalDays: DataTypes.DECIMAL(4, 1),
  reason: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
}, {
  tableName: 'leave_requests',
  timestamps: false,
});

module.exports = Leave;
