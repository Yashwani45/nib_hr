// backend/models/finance/employeeSalaryAssignment.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EmployeeSalaryAssignment = sequelize.define('EmployeeSalaryAssignment', {
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
  salaryStructureId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'salary_structure_id',
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
  baseGross: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'base_gross',
  },
  ctc: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'employee_salary_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
});

module.exports = EmployeeSalaryAssignment;
