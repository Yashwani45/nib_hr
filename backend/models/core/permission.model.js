// backend/models/core/permission.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'permissions',
  timestamps: false,
});

module.exports = Permission;
