const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('QuizAttempt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  course_id: { type: DataTypes.UUID, allowNull: false },
  lesson_id: { type: DataTypes.UUID, allowNull: false },
  quiz_id: { type: DataTypes.UUID, allowNull: false },
  watch_cycle: { type: DataTypes.INTEGER, allowNull: false },
  attempt_number: { type: DataTypes.INTEGER, allowNull: false },
  correct_count: { type: DataTypes.INTEGER, allowNull: false },
  question_count: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  passed: { type: DataTypes.BOOLEAN, allowNull: false },
  answers: { type: DataTypes.JSONB, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'quiz_attempts', timestamps: false });
