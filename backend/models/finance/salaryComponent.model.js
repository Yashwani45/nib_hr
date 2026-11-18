// backend/models/finance/salaryComponent.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SalaryComponent = sequelize.define('SalaryComponent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  salaryStructureId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'salary_structure_id',
  },
  componentCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'component_code',
  },
  componentName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'component_name',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  componentType: {
    type: DataTypes.ENUM('Earning', 'Deduction'),
    allowNull: true,
    field: 'component_type',
  },
  type: {
    type: DataTypes.ENUM('Earning', 'Deduction'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Earning',
    field: 'component_category',
  },
  calculationType: {
    type: DataTypes.ENUM('Fixed', 'Percentage', 'Formula'),
    allowNull: false,
    defaultValue: 'Fixed',
    field: 'calculation_type',
  },
  calculationBase: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'calculation_base',
  },
  formula: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  frequency: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Monthly',
  },
  minimumAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'minimum_amount',
  },
  maximumAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'maximum_amount',
  },
  eligibilityCondition: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'eligibility_condition',
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'display_order',
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  percentageBase: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'percentage_base',
  },
  referenceComponent: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_component',
  },
  isTaxable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_taxable',
  },
  isStatutory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_statutory',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'salary_components',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
});

module.exports = SalaryComponent;
