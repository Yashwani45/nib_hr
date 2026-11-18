const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const BiometricDevice = sequelize.define('BiometricDevice', {
  deviceId: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    field: 'device_id',
  },
  lastSeenAt: {
    type: DataTypes.DATE(3),
    allowNull: true,
    field: 'last_seen_at',
  },
}, {
  tableName: 'biometric_devices',
  timestamps: false,
  underscored: true,
});

module.exports = BiometricDevice;
