const { Op } = require('sequelize');
const {
  Cart,
  CartItem,
  Course,
  Coupon,
  Enrollment,
  Payment,
  sequelize,
} = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PAYMENT_METHODS = new Set(['MockCard', 'BankTransfer', 'Cash']);

const processCheckout = async (userId, payload = {}) => {
  const paymentMethod = payload.payment_method || 'MockCard';
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    throw new AppError(400, 'Unsupported payment method.');
  }

  const couponCode = String(payload.coupon_code || '').trim();

  return sequelize.transaction(async (transaction) => {
    const cart = await Cart.findOne({
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cart) throw new AppError(400, 'Your cart is empty.');

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      order: [['course_id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cartItems.length) throw new AppError(400, 'Your cart is empty.');

    const courseIds = cartItems.map((item) => item.course_id);
    const courses = await Course.findAll({
      where: { id: { [Op.in]: courseIds } },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (courses.length !== courseIds.length || courses.some((course) => course.status !== 'Approved')) {
      throw new AppError(409, 'One or more courses are no longer available. Refresh your cart.');
    }

    const existingEnrollments = await Enrollment.findAll({
      where: { user_id: userId, course_id: { [Op.in]: courseIds } },
      attributes: ['course_id'],
      transaction,
    });
    if (existingEnrollments.length) {
      throw new AppError(409, 'Your cart contains a course you already own.');
    }

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('code')),
          couponCode.toLowerCase(),
        ),
        transaction,
      });
      if (!coupon) throw new AppError(400, 'Coupon code is invalid.');
    }

    const now = new Date();
    const purchasedItems = courses.map((course) => {
      const basePrice = Number(course.price);
      const couponApplies = coupon
        && coupon.instructor_id === course.instructor_id
        && (!coupon.course_id || coupon.course_id === course.id);
      const discountPercent = couponApplies ? Number(coupon.discount_percent) : 0;
      const amount = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
      return { course, amount, discountPercent, couponId: couponApplies ? coupon.id : null };
    });

    if (coupon && !purchasedItems.some((item) => item.couponId)) {
      throw new AppError(400, 'This coupon does not apply to any course in your cart.');
    }

    await Payment.bulkCreate(purchasedItems.map((item) => ({
      amount: item.amount.toFixed(2),
      payment_method: paymentMethod,
      status: 'Success',
      user_id: userId,
      course_id: item.course.id,
      coupon_id: item.couponId,
      created_at: now,
      updated_at: now,
    })), { transaction });

    await Enrollment.bulkCreate(courses.map((course) => ({
      progress: 0,
      user_id: userId,
      course_id: course.id,
      created_at: now,
      updated_at: now,
    })), { transaction });

    await CartItem.destroy({ where: { cart_id: cart.id }, transaction });
    await cart.update({ updated_at: now }, { transaction });

    return {
      payment_status: 'Success',
      payment_method: paymentMethod,
      total: purchasedItems.reduce((sum, item) => sum + item.amount, 0),
      items: purchasedItems.map((item) => ({
        course_id: item.course.id,
        title: item.course.title,
        amount: item.amount,
        discount_percent: item.discountPercent,
      })),
    };
  });
};

exports.checkout = asyncHandler(async (req, res) => {
  const result = await processCheckout(req.user.id, req.body);
  res.status(201).json({ message: 'Checkout completed successfully.', checkout: result });
});
