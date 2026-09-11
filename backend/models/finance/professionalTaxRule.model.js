// backend/models/finance/professionalTaxRule.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ProfessionalTaxRule = sequelize.define('ProfessionalTaxRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  minSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'min_salary',
  },
  maxSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'max_salary',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'tax_amount',
  },
  effectiveFrom: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'effective_from',
  },
}, {
  tableName: 'professional_tax_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProfessionalTaxRule;
