const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const BiometricDeviceUser = sequelize.define('BiometricDeviceUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'employee_id',
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'device_id',
  },
  deviceUserId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'device_user_id',
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  createdBy: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'created_by',
  },
}, {
  tableName: 'biometric_device_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
});

module.exports = BiometricDeviceUser;
