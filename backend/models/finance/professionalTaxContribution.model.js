// backend/models/finance/professionalTaxContribution.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ProfessionalTaxContribution = sequelize.define('ProfessionalTaxContribution', {
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
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ptAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'pt_amount',
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
  tableName: 'professional_tax_contributions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProfessionalTaxContribution;
