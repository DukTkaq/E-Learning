const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstructorCertificate = sequelize.define('InstructorCertificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT,
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
  tableName: 'instructor_certificates',
  timestamps: false
});

module.exports = InstructorCertificate;

