// backend/models/operations/holiday.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Holiday = sequelize.define('Holiday', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  holidayName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'holiday_name',
  },
  holidayDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'holiday_date',
  },
  holidayType: {
    type: DataTypes.ENUM('Public', 'National', 'Restricted', 'Company Mandatory', 'Optional'),
    defaultValue: 'Public',
    field: 'holiday_type',
  },
  branch: {
    type: DataTypes.STRING,
    defaultValue: 'All Branches',
    field: 'branch',
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'holidays',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
});

module.exports = Holiday;
