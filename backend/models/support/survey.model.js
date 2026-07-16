// backend/models/support/survey.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'Announcement',
  },
  publishDate: DataTypes.STRING,
  content: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'announcements_surveys',
  timestamps: false,
});

module.exports = Survey;
