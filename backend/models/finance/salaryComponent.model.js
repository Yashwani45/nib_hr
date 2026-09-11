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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Earning', 'Deduction'),
    allowNull: false,
  },
  calculationType: {
    type: DataTypes.ENUM('Fixed', 'Percentage'),
    allowNull: false,
    field: 'calculation_type',
  },
  value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  referenceComponent: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_component',
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
