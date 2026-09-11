// backend/models/finance/esiContribution.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EsiContribution = sequelize.define('EsiContribution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'employee_id',
  },
  payrollItemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payroll_item_id',
  },
  esiNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'esi_number',
  },
  employeeContribution: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'employee_contribution',
  },
  employerContribution: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'employer_contribution',
  },
  grossWages: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'gross_wages',
  },
  month: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'esi_contributions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EsiContribution;
