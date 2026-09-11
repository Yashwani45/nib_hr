// backend/models/talent/employeePromotion.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EmployeePromotion = sequelize.define('EmployeePromotion', {
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
  currentDesignationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'current_designation_id',
  },
  proposedDesignationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'proposed_designation_id',
  },
  reason: {
    type: DataTypes.TEXT,
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
  tableName: 'employee_promotions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmployeePromotion;
