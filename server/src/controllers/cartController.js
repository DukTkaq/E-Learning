const { UniqueConstraintError } = require('sequelize');
const { Cart, CartItem, Course, Category, Enrollment, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const COURSE_INCLUDE = {
  model: Course,
  attributes: ['id', 'title', 'description', 'thumbnail', 'price', 'status'],
  include: [{ model: Category, attributes: ['id', 'name'] }],
};

const getOrCreateCart = async (userId, transaction) => {
  const [cart] = await Cart.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, created_at: new Date(), updated_at: new Date() },
    transaction,
  });
  return cart;
};

const getCartData = async (userId) => {
  const cart = await Cart.findOne({
    where: { user_id: userId },
    include: [{ model: CartItem, include: [COURSE_INCLUDE] }],
    order: [[CartItem, 'added_at', 'DESC']],
  });

  const items = cart?.CartItems || [];
  return {
    id: cart?.id || null,
    items,
    item_count: items.length,
    subtotal: items.reduce((sum, item) => sum + Number(item.Course?.price || 0), 0),
  };
};

const addCartItem = async (userId, courseId) => {
  await sequelize.transaction(async (transaction) => {
    const course = await Course.findByPk(courseId, { transaction });
    if (!course) throw new AppError(404, 'Course not found.');
    if (course.status !== 'Approved') {
      throw new AppError(409, 'Only approved courses can be added to the cart.');
    }

    const enrolled = await Enrollment.count({
      where: { user_id: userId, course_id: courseId },
      transaction,
    });
    if (enrolled) throw new AppError(409, 'You are already enrolled in this course.');

    const cart = await getOrCreateCart(userId, transaction);
    try {
      await CartItem.create({
        cart_id: cart.id,
        course_id: courseId,
        added_at: new Date(),
      }, { transaction });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError(409, 'This course is already in your cart.');
      }
      throw error;
    }
  });

  return getCartData(userId);
};

const removeCartItem = async (userId, courseId) => {
  const cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) throw new AppError(404, 'Cart item not found.');

  const deleted = await CartItem.destroy({
    where: { cart_id: cart.id, course_id: courseId },
  });
  if (!deleted) throw new AppError(404, 'Cart item not found.');
  return getCartData(userId);
};

exports.get = asyncHandler(async (req, res) => {
  res.json({ cart: await getCartData(req.user.id) });
});

exports.addItem = asyncHandler(async (req, res) => {
  const cart = await addCartItem(req.user.id, req.body.course_id);
  res.status(201).json({ message: 'Course added to cart.', cart });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await removeCartItem(req.user.id, req.params.courseId);
  res.json({ message: 'Course removed from cart.', cart });
});
