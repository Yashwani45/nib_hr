// backend/models/core/employeeFaceProfile.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const EmployeeFaceProfile = sequelize.define('EmployeeFaceProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  organization_id: {
    type: DataTypes.STRING,
    allowNull: true, // If needed for multi-tenant isolation
  },
  face_embedding: {
    type: DataTypes.JSON, // Stores 128D descriptor array or object with sample descriptors
    allowNull: false,
  },
  model_version: {
    type: DataTypes.STRING,
    defaultValue: 'face-api-v1',
  },
  sample_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'REVOKED'),
    defaultValue: 'ACTIVE',
  },
  enrolled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'employee_face_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmployeeFaceProfile;
