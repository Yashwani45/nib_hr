// backend/models/finance/tdsMaster.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const TdsMaster = sequelize.define('TdsMaster', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  financialYear: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'financial_year',
  },
  taxRegime: {
    type: DataTypes.ENUM('New Tax Regime (Sec 115BAC)', 'Old Tax Regime'),
    defaultValue: 'New Tax Regime (Sec 115BAC)',
    field: 'tax_regime',
  },
  standardDeduction: {
    type: DataTypes.FLOAT,
    defaultValue: 75000,
    field: 'standard_deduction',
  },
  taxSlabs: {
    type: DataTypes.JSON,
    field: 'tax_slabs',
  },
  cessPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 4.0,
    field: 'cess_percentage',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'tds_masters',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = TdsMaster;
