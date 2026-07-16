// backend/models/core/employee.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: DataTypes.STRING,
  gender: DataTypes.STRING,
  dob: DataTypes.STRING,
  maritalStatus: DataTypes.STRING,
  nationality: DataTypes.STRING,
  employmentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  employmentType: DataTypes.STRING,
  joiningDate: DataTypes.STRING,
  department: DataTypes.STRING,
  departmentId: DataTypes.INTEGER, // association helper
  designation: DataTypes.STRING,
  manager: DataTypes.STRING,
  managerId: DataTypes.INTEGER, // association helper
  branch: DataTypes.STRING,
  branchId: DataTypes.INTEGER, // association helper
  shift: DataTypes.STRING,
  companyEmail: DataTypes.STRING,
  personalEmail: DataTypes.STRING,
  phone: DataTypes.STRING,
  bankName: DataTypes.STRING,
  accountNo: DataTypes.STRING,
  ifscCode: DataTypes.STRING,
  pan: DataTypes.STRING,
  aadhaar: DataTypes.STRING,
  pfNum: DataTypes.STRING,
  esicNum: DataTypes.STRING,
  username: DataTypes.STRING,
  role: DataTypes.STRING,
  userId: DataTypes.INTEGER, // association helper
}, {
  tableName: 'employee_profile',
  timestamps: false,
});

module.exports = Employee;
