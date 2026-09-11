// backend/models/talent/employeeIncrement.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EmployeeIncrement = sequelize.define('EmployeeIncrement', {
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
  appraisalId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'appraisal_id',
  },
  currentSalaryAssignmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'current_salary_assignment_id',
  },
  currentSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'current_salary',
  },
  incrementPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'increment_percentage',
  },
  incrementAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'increment_amount',
  },
  newSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'new_salary',
  },
  reason: {
    type: DataTypes.TEXT,
  },
  performanceScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'performance_score',
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'effective_date',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Implemented'),
    defaultValue: 'Pending',
  },
  approvedBy: {
    type: DataTypes.UUID,
    field: 'approved_by',
  },
}, {
  tableName: 'employee_increments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmployeeIncrement;
