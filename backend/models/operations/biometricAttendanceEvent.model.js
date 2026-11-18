const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const BiometricAttendanceEvent = sequelize.define('BiometricAttendanceEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'device_id',
  },
  deviceEventId: {
    type: DataTypes.STRING(128),
    allowNull: false,
    field: 'device_event_id',
  },
  employeeId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'employee_id',
  },
  deviceUserId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'device_user_id',
  },
  eventTimestamp: {
    type: DataTypes.DATE(3),
    allowNull: false,
    field: 'event_timestamp',
  },
  punchType: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false,
    field: 'punch_type',
  },
  source: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  attendanceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'attendance_id',
  },
  status: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
}, {
  tableName: 'biometric_attendance_events',
  timestamps: false,
  underscored: true,
});

module.exports = BiometricAttendanceEvent;
