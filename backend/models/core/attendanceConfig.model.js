// backend/models/core/attendanceConfig.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const OrgAttendanceConfig = sequelize.define('OrgAttendanceConfig', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  company_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'org_attendance_configs',
  timestamps: true,
  underscored: true,
});

const OrgAttendanceMethod = sequelize.define('OrgAttendanceMethod', {
  id: {
    type: DataTypes.CHAR(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  config_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  method_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'org_attendance_methods',
  timestamps: true,
  underscored: true,
});

// Relationships
OrgAttendanceConfig.hasMany(OrgAttendanceMethod, { as: 'methods', foreignKey: 'config_id', onDelete: 'CASCADE' });
OrgAttendanceMethod.belongsTo(OrgAttendanceConfig, { as: 'config', foreignKey: 'config_id' });

module.exports = {
  OrgAttendanceConfig,
  OrgAttendanceMethod,
};
