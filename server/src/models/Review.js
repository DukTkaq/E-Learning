const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  instructor_reply: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  replied_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  timestamps: false
});

module.exports = Review;
