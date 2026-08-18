const asyncHandler = require('../utils/asyncHandler');
const checkoutService = require('../services/checkoutService');

exports.checkout = asyncHandler(async (req, res) => {
  const result = await checkoutService.checkout(req.user.id, req.body);
  res.status(201).json({ message: 'Checkout completed successfully.', checkout: result });
});
