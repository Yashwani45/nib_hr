// backend/models/core/navigationMenu.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const NavigationMenu = sequelize.define('NavigationMenu', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  parentId: {
    type: DataTypes.UUID,
    field: 'parent_id',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  route: {
    type: DataTypes.STRING,
  },
  icon: {
    type: DataTypes.STRING,
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'display_order',
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'navigation_menus',
  timestamps: false,
});

module.exports = NavigationMenu;
