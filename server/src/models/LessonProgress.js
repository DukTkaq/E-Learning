const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('LessonProgress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  course_id: { type: DataTypes.UUID, allowNull: false },
  lesson_id: { type: DataTypes.UUID, allowNull: false },
  progress_percent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  watch_cycle: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  last_watched_at: { type: DataTypes.DATE, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'lesson_progress', timestamps: false });
