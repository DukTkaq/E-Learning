const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pending'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  coupon_id: {
    type: DataTypes.UUID,
    allowNull: true // Optional
  },
  checkout_ref: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  provider_transaction_no: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  provider_response_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'payments',
  timestamps: false
});

module.exports = Payment;
