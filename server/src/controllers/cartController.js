const asyncHandler = require('../utils/asyncHandler');
const cartService = require('../services/cartService');

exports.get = asyncHandler(async (req, res) => {
  res.json({ cart: await cartService.getCart(req.user.id) });
});

exports.addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body.course_id);
  res.status(201).json({ message: 'Course added to cart.', cart });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.courseId);
  res.json({ message: 'Course removed from cart.', cart });
});
