// backend/models/operations/attendance.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeId: DataTypes.INTEGER, // association helper
  name: DataTypes.STRING,
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checkIn: DataTypes.STRING,
  checkOut: DataTypes.STRING,
  workingHours: DataTypes.DECIMAL(4, 2),
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Present',
  },
  lateComing: DataTypes.INTEGER,
  earlyLeaving: DataTypes.INTEGER,
  overtime: DataTypes.INTEGER,
}, {
  tableName: 'daily_attendance',
  timestamps: false,
});

module.exports = Attendance;
