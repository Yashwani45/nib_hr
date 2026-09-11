// backend/models/core/dashboardWidget.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const DashboardWidget = sequelize.define('DashboardWidget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  componentName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'component_name',
  },
  size: {
    type: DataTypes.ENUM('Small', 'Medium', 'Large', 'FullWidth'),
    defaultValue: 'Small',
  },
  minRoleLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    field: 'min_role_level',
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'dashboard_widgets',
  timestamps: false,
});

module.exports = DashboardWidget;
