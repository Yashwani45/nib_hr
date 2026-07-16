// backend/models/operations/shift.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shiftCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  shiftName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  graceTime: DataTypes.INTEGER,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'shift_master',
  timestamps: false,
});

module.exports = Shift;
