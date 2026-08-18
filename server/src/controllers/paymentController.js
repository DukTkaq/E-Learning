const { Course, Payment } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

exports.history = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({
    where: { user_id: req.user.id, status: 'Success' },
    include: [{ model: Course, attributes: ['id', 'title', 'thumbnail'] }],
    order: [['paid_at', 'DESC'], ['created_at', 'DESC']],
  });
  res.json({ payments });
});
