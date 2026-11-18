// backend/models/finance/salaryStructure.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SalaryStructure = sequelize.define('SalaryStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  structureName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'structure_name',
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  payFrequency: {
    type: DataTypes.STRING(50),
    defaultValue: 'Monthly',
    field: 'pay_frequency',
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'department_id',
  },
  designationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'designation_id',
  },
  departmentIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'department_ids',
  },
  designationIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'designation_ids',
  },
  grade: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referenceSalaryType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Monthly Gross',
    field: 'reference_salary_type',
  },
  effectiveFrom: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'effective_from',
  },
  effectiveTo: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'effective_to',
  },
  employmentCategory: {
    type: DataTypes.STRING(50),
    defaultValue: 'Full-Time',
    field: 'employment_category',
  },
  createdBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'created_by',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'salary_structures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
});

module.exports = SalaryStructure;
