// backend/models/core/role.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roleName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name',
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

// Define name property on prototype for complete backwards compatibility without using DataTypes.VIRTUAL
Object.defineProperty(Role.prototype, 'name', {
  get() {
    return this.roleName;
  },
  set(value) {
    this.roleName = value;
  }
});

module.exports = Role;
