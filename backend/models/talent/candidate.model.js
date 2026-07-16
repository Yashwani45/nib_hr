// backend/models/talent/candidate.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  candidateId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: DataTypes.STRING,
  qualification: DataTypes.STRING,
  experience: DataTypes.DECIMAL(5, 2),
  currentCompany: DataTypes.STRING,
  expectedSalary: DataTypes.STRING,
  skills: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Applied',
  },
}, {
  tableName: 'candidate_database',
  timestamps: false,
});

module.exports = Candidate;
