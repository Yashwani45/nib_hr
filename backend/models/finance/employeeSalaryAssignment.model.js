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
    type: DataTypes.STRING(255),
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
  grossSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'gross_salary',
  },
  baseGross: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'base_gross',
  },
  annualCtc: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'annual_ctc',
  },
  ctc: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
    allowNull: false,
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
  revisionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'revision_reason',
  },
  approvalStatus: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Approved',
    field: 'approval_status',
  },
  componentOverrides: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'component_overrides',
  },
  salaryBreakdown: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'salary_breakdown',
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
