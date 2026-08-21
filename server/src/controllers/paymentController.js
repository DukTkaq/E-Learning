const { Coupon, Course, Payment, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const buildHistoryQuery = (userId) => ({
  where: { user_id: userId, status: 'Success' },
  include: [
    { model: Course, attributes: ['id', 'title', 'thumbnail'] },
    { model: Coupon, attributes: ['id', 'code', 'discount_percent'] },
  ],
  order: [[sequelize.literal('COALESCE("Payment"."paid_at", "Payment"."created_at")'), 'DESC']],
});

exports.history = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll(buildHistoryQuery(req.user.id));
  res.json({ payments });
});

exports.__test = { buildHistoryQuery };
