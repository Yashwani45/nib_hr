// backend/models/core/employee.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employee_name',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  officialEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'officialEmail',
  },
  personalEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'personalEmail',
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employeeId',
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employeeCode',
  },
  employeeStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employeeStatus',
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'firstName',
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'middleName',
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'lastName',
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'dateOfBirth',
  },
  maritalStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'maritalStatus',
  },
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'bloodGroup',
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfJoining: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'dateOfJoining',
  },
  reportingManager: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reportingManager',
  },
  employeeType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'employeeType',
  },
  shift: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  weeklyOff: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'weeklyOff',
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'mobileNumber',
  },
  alternateMobile: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'alternateMobile',
  },
  currentAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'currentAddress',
  },
  permanentAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'permanentAddress',
  },
  highestDegree: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'highestDegree',
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  university: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  prevCompany: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'prevCompany',
  },
  prevDesignation: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'prevDesignation',
  },
  profileData: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'profile_data',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Employee;
