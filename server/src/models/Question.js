const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  option_a: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_b: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_c: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_d: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correct_answer: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  quiz_id: {
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
  tableName: 'questions',
  timestamps: false
});

module.exports = Question;
