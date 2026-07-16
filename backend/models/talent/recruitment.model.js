// backend/models/talent/recruitment.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Recruitment = sequelize.define('Recruitment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reqId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: DataTypes.STRING,
  departmentId: DataTypes.INTEGER, // association helper
  vacancies: DataTypes.INTEGER,
  employmentType: DataTypes.STRING,
  experienceRequired: DataTypes.STRING,
  skills: DataTypes.TEXT,
  budgetSalary: DataTypes.STRING,
  joiningDate: DataTypes.STRING,
  approvalStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Open',
  },
}, {
  tableName: 'job_requisition',
  timestamps: false,
});

module.exports = Recruitment;
