// backend/models/talent/ratingScale.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const RatingScale = sequelize.define('RatingScale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scaleName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'scale_name',
  },
  description: {
    type: DataTypes.TEXT,
  },
  minRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.00,
    field: 'min_rating',
  },
  maxRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00,
    field: 'max_rating',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'rating_scales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RatingScale;
