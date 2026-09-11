// backend/models/operations/leaveType.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const LeaveType = sequelize.define('LeaveType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  leaveCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'leave_code',
  },
  leaveName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'leave_name',
  },
  paidType: {
    type: DataTypes.ENUM('Paid', 'Unpaid'),
    defaultValue: 'Paid',
    field: 'paid_type',
  },
  maxDays: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    field: 'max_days',
  },
  carryForward: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'carry_forward',
  },
  maxCarryForwardDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'max_carry_forward_days',
  },
  encashment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'encashment',
  },
  approvalWorkflow: {
    type: DataTypes.STRING,
    defaultValue: 'Manager -> HR',
    field: 'approval_workflow',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'leave_type_masters',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = LeaveType;
