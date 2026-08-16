const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cart_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  added_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  }
}, {
  tableName: 'cart_items',
  timestamps: false
});

module.exports = CartItem;
