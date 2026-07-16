// backend/models/talent/interview.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  appId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  candidate: DataTypes.STRING,
  candidateId: DataTypes.INTEGER, // association helper
  jobPosting: DataTypes.STRING,
  recruitmentId: DataTypes.INTEGER, // association helper
  appliedDate: DataTypes.STRING,
  stage: {
    type: DataTypes.STRING,
    defaultValue: 'Screening',
  },
  recruiter: DataTypes.STRING,
  interviewerId: DataTypes.INTEGER, // association helper
  rating: DataTypes.INTEGER,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
}, {
  tableName: 'ats_applicant_tracking',
  timestamps: false,
});

module.exports = Interview;
