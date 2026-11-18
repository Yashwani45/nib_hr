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
    field: 'empId',
  },
  emp_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  employeeId: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'employeeId',
  },
  name: DataTypes.STRING,
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  attendance_date: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkIn: {
    type: DataTypes.STRING,
    field: 'checkIn',
  },
  check_in: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  check_in_time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.STRING,
    field: 'checkOut',
  },
  check_out: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  check_out_time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.DECIMAL(4, 2),
    field: 'workingHours',
  },
  working_hours: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  total_working_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Present',
  },
  attendance_status: {
    type: DataTypes.STRING,
    defaultValue: 'Present',
  },
  lateComing: {
    type: DataTypes.INTEGER,
    field: 'lateComing',
  },
  late_coming: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  late_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  earlyLeaving: {
    type: DataTypes.INTEGER,
    field: 'earlyLeaving',
  },
  early_leaving: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  early_departure_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  overtime: DataTypes.INTEGER,
  verification_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'MANUAL',
  },
  check_in_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'MANUAL',
  },
  check_out_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  verification_status: {
    type: DataTypes.STRING,
    defaultValue: 'VERIFIED',
  },
  latitude: DataTypes.DECIMAL(10, 8),
  longitude: DataTypes.DECIMAL(11, 8),
  accuracy: DataTypes.DECIMAL(8, 2),
  attendance_location: DataTypes.STRING,
  device_id: DataTypes.STRING,
  ip_address: DataTypes.STRING,
  device_info: DataTypes.STRING,
  gps_location: DataTypes.STRING,
  selfie_url: DataTypes.TEXT,
  break_hours: DataTypes.DECIMAL(4, 2),
  remarks: DataTypes.TEXT,
  company: DataTypes.STRING,
  branch: DataTypes.STRING,
  department: DataTypes.STRING,
  shift: DataTypes.STRING,
}, {
  tableName: 'daily_attendance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
});

module.exports = Attendance;
