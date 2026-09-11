// backend/models/core/designation.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Designation = sequelize.define('Designation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  desigCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'desig_code',
  },
  desigName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'desig_name',
  },
  departmentId: {
    type: DataTypes.UUID,
    field: 'department_id',
  },
  department: {
    type: DataTypes.STRING,
    field: 'department',
  },
  grade: {
    type: DataTypes.STRING,
    field: 'grade',
  },
  jobLevel: {
    type: DataTypes.STRING,
    field: 'job_level',
  },
  reportingTo: {
    type: DataTypes.STRING,
    field: 'reporting_to',
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
  },
  minExperience: {
    type: DataTypes.STRING,
    field: 'min_experience',
  },
  maxExperience: {
    type: DataTypes.STRING,
    field: 'max_experience',
  },
  jobCategory: {
    type: DataTypes.STRING,
    field: 'job_category',
  },
  employmentType: {
    type: DataTypes.STRING,
    field: 'employment_type',
  },
  assignedEmployeesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'assigned_employees_count',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'designations',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Designation;
