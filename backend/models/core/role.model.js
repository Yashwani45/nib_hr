// backend/models/core/role.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  permissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  // Virtual field for backwards compatibility with user.role.name
  name: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.roleName;
    },
    set(value) {
      this.roleName = value;
    },
  },
}, {
  tableName: 'rbac_roles',
  timestamps: false,
});

module.exports = Role;
