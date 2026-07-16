// backend/models/support/ticket.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticketNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  empName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeId: DataTypes.INTEGER, // association helper
  category: DataTypes.STRING,
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium',
  },
  assignedTo: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Open',
  },
}, {
  tableName: 'hr_tickets',
  timestamps: false,
});

module.exports = Ticket;
