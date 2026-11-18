// backend/models/finance/statutoryConfiguration.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const StatutoryConfiguration = sequelize.define('StatutoryConfiguration', {
  id: {
    type: DataTypes.STRING(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ruleCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'rule_code',
  },
  ruleName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'rule_name',
  },
  applicableRegion: {
    type: DataTypes.STRING(100),
    defaultValue: 'All India',
    allowNull: false,
    field: 'applicable_region',
  },
  employeeCategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'employee_category',
  },
  employerCategory: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'employer_category',
  },
  effectiveFrom: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'effective_from',
  },
  effectiveTo: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'effective_to',
  },
  employeeRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'employee_rate',
  },
  employerRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'employer_rate',
  },
  wageCeiling: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'wage_ceiling',
  },
  calculationBasis: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'calculation_basis',
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
  configurationJson: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'configuration_json',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  createdBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'created_by',
  },
  approvedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'approved_by',
  },
}, {
  tableName: 'statutory_configurations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = StatutoryConfiguration;
