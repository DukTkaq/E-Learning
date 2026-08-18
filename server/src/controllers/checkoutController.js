const crypto = require('crypto');
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
const {
  VNPAY_VERSION,
  buildPaymentUrl,
  formatVnpayDate,
  getClientIp,
  getConfig,
  verifySignature,
} = require('../utils/vnpay');

const PAYMENT_EXPIRY_MINUTES = 15;
const VNPAY_MAX_AMOUNT = 999_999_999_999;
const CHECKOUT_REF_PATTERN = /^EL\d{8}[a-f0-9]{20}$/;

const amountToMinorUnits = (amount) => Math.round(Number(amount) * 100);
const minorUnitsToAmount = (amount) => Number((amount / 100).toFixed(2));

const createCheckoutRef = (date) => {
  const day = formatVnpayDate(date).slice(0, 8);
  return `EL${day}${crypto.randomBytes(10).toString('hex')}`;
};

const calculatePurchasedItems = (courses, coupon) => courses.map((course) => {
  const baseAmount = amountToMinorUnits(course.price);
  if (!Number.isSafeInteger(baseAmount) || baseAmount < 0) {
    throw new AppError(409, `Course "${course.title}" has an invalid price.`);
  }
  const couponApplies = coupon
    && coupon.instructor_id === course.instructor_id
    && (!coupon.course_id || coupon.course_id === course.id);
  const discountPercent = couponApplies ? Number(coupon.discount_percent) : 0;
  const amountMinor = Math.round(baseAmount * (100 - discountPercent) / 100);

  return {
    course,
    amountMinor,
    discountPercent,
    couponId: couponApplies ? coupon.id : null,
  };
});

const findCoupon = async (couponCode, transaction) => {
  if (!couponCode) return null;

  const coupon = await Coupon.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('code')),
      couponCode.toLowerCase(),
    ),
    transaction,
  });
  if (!coupon) throw new AppError(400, 'Coupon code is invalid.');
  const discountPercent = Number(coupon.discount_percent);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new AppError(409, 'This coupon has an invalid discount value.');
  }
  return coupon;
};

const getVnpayConfigOrThrow = () => {
  try {
    return getConfig();
  } catch (error) {
    throw new AppError(503, error.message);
  }
};

const loadCartForCheckout = async (userId, transaction) => {
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
  });
  if (courses.length !== courseIds.length || courses.some((course) => course.status !== 'Approved')) {
    throw new AppError(409, 'One or more courses are no longer available. Refresh your cart.');
  }

  const ownedCourse = await Enrollment.findOne({
    where: { user_id: userId, course_id: { [Op.in]: courseIds } },
    attributes: ['course_id'],
    transaction,
  });
  if (ownedCourse) throw new AppError(409, 'Your cart contains a course you already own.');

  return { courses, courseIds };
};

const buildVnpayRequest = ({ checkoutRef, totalMinor, createdAt, expiresAt, req, config }) => ({
  vnp_Version: VNPAY_VERSION,
  vnp_Command: 'pay',
  vnp_TmnCode: config.tmnCode,
  vnp_Amount: totalMinor,
  vnp_CreateDate: formatVnpayDate(createdAt),
  vnp_CurrCode: 'VND',
  vnp_ExpireDate: formatVnpayDate(expiresAt),
  vnp_IpAddr: getClientIp(req),
  vnp_Locale: 'vn',
  vnp_OrderInfo: `Thanh toan khoa hoc ${checkoutRef}`,
  vnp_OrderType: 'other',
  vnp_ReturnUrl: config.returnUrl,
  vnp_TxnRef: checkoutRef,
});

const createPendingPayments = async (userId, couponCode) => sequelize.transaction(async (transaction) => {
  const { courses, courseIds } = await loadCartForCheckout(userId, transaction);
  const coupon = await findCoupon(couponCode, transaction);
  const purchasedItems = calculatePurchasedItems(courses, coupon);

  if (coupon && !purchasedItems.some((item) => item.couponId)) {
    throw new AppError(400, 'This coupon does not apply to any course in your cart.');
  }
  const totalMinor = purchasedItems.reduce((sum, item) => sum + item.amountMinor, 0);
  if (totalMinor <= 0) {
    throw new AppError(400, 'VNPay requires a checkout total greater than 0 VND.');
  }
  if (!Number.isSafeInteger(totalMinor) || totalMinor > VNPAY_MAX_AMOUNT) {
    throw new AppError(400, 'The checkout total is outside VNPay limits.');
  }

  const now = new Date();
  await Payment.update(
    { status: 'Expired', updated_at: now },
    {
      where: {
        user_id: userId,
        payment_method: 'VNPay',
        status: 'Pending',
        expires_at: { [Op.lte]: now },
      },
      transaction,
    },
  );

  const activePayments = await Payment.findAll({
    where: {
      user_id: userId,
      payment_method: 'VNPay',
      status: 'Pending',
    },
    order: [['course_id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (activePayments.length) {
    const sortedCourseIds = [...courseIds].sort();
    const references = new Set(activePayments.map((payment) => payment.checkout_ref));
    const activeCourseIds = activePayments.map((payment) => payment.course_id).sort();
    const sameCart = references.size === 1
      && activeCourseIds.length === sortedCourseIds.length
      && activeCourseIds.every((id, index) => id === sortedCourseIds[index]);

    if (!sameCart) {
      throw new AppError(409, 'Another VNPay checkout is still pending for one of these courses.');
    }

    return {
      checkoutRef: activePayments[0].checkout_ref,
      createdAt: activePayments[0].created_at,
      expiresAt: activePayments[0].expires_at,
      totalMinor: activePayments.reduce((sum, payment) => sum + amountToMinorUnits(payment.amount), 0),
    };
  }

  const checkoutRef = createCheckoutRef(now);
  const expiresAt = new Date(now.getTime() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

  await Payment.bulkCreate(purchasedItems.map((item) => ({
    amount: minorUnitsToAmount(item.amountMinor).toFixed(2),
    payment_method: 'VNPay',
    status: 'Pending',
    user_id: userId,
    course_id: item.course.id,
    coupon_id: item.couponId,
    checkout_ref: checkoutRef,
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
  })), { transaction });

  return {
    checkoutRef,
    createdAt: now,
    expiresAt,
    totalMinor,
  };
});

exports.createVnpayPayment = asyncHandler(async (req, res) => {
  const config = getVnpayConfigOrThrow();
  const couponCode = String(req.body?.coupon_code || '').trim();
  const pending = await createPendingPayments(req.user.id, couponCode);
  const params = buildVnpayRequest({ ...pending, req, config });
  const paymentUrl = buildPaymentUrl(config.paymentUrl, params, config.hashSecret);

  res.status(201).json({
    message: 'VNPay payment created.',
    checkout_ref: pending.checkoutRef,
    expires_at: pending.expiresAt,
    payment_url: paymentUrl,
  });
});

const processVnpayIpn = async (query, config) => {
  if (!verifySignature(query, config.hashSecret) || query.vnp_TmnCode !== config.tmnCode) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const checkoutRef = String(query.vnp_TxnRef || '');
  const receivedAmountText = String(query.vnp_Amount || '');
  const receivedAmount = Number(receivedAmountText);
  if (!CHECKOUT_REF_PATTERN.test(checkoutRef)
    || !/^\d{1,12}$/.test(receivedAmountText)
    || !Number.isSafeInteger(receivedAmount)) {
    return { RspCode: '99', Message: 'Invalid request' };
  }

  return sequelize.transaction(async (transaction) => {
    const payments = await Payment.findAll({
      where: { checkout_ref: checkoutRef, payment_method: 'VNPay' },
      order: [['course_id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payments.length) return { RspCode: '01', Message: 'Order not Found' };

    const expectedAmount = payments.reduce((sum, payment) => sum + amountToMinorUnits(payment.amount), 0);
    if (expectedAmount !== receivedAmount) return { RspCode: '04', Message: 'Invalid Amount' };
    if (payments.some((payment) => payment.status !== 'Pending')) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const now = new Date();
    const succeeded = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
    const status = succeeded ? 'Success' : 'Failed';
    const courseIds = payments.map((payment) => payment.course_id);
    const userId = payments[0].user_id;

    await Payment.update({
      status,
      provider_transaction_no: String(query.vnp_TransactionNo || ''),
      provider_response_code: String(query.vnp_ResponseCode || ''),
      paid_at: succeeded ? now : null,
      updated_at: now,
    }, {
      where: { checkout_ref: checkoutRef, status: 'Pending' },
      transaction,
    });

    if (succeeded) {
      await Enrollment.bulkCreate(courseIds.map((courseId) => ({
        progress: 0,
        user_id: userId,
        course_id: courseId,
        created_at: now,
        updated_at: now,
      })), { transaction, ignoreDuplicates: true });

      const cart = await Cart.findOne({ where: { user_id: userId }, transaction });
      if (cart) {
        await CartItem.destroy({
          where: { cart_id: cart.id, course_id: { [Op.in]: courseIds } },
          transaction,
        });
        await cart.update({ updated_at: now }, { transaction });
      }
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  });
};

exports.vnpayIpn = async (req, res) => {
  try {
    const result = await processVnpayIpn(req.query, getConfig());
    return res.status(200).json(result);
  } catch (error) {
    console.error('VNPay IPN error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

exports.vnpayReturn = async (req, res) => {
  let signatureValid = false;
  let clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const config = getConfig();
    clientUrl = config.clientUrl;
    signatureValid = verifySignature(req.query, config.hashSecret)
      && req.query.vnp_TmnCode === config.tmnCode;

    // IPN remains the primary confirmation channel. Processing the signed
    // return as well keeps checkout recoverable when a sandbox IPN is delayed
    // or not configured. processVnpayIpn is transactional and idempotent.
    if (signatureValid) {
      const result = await processVnpayIpn(req.query, config);
      if (!['00', '02'].includes(result.RspCode)) {
        console.warn('VNPay return could not confirm checkout:', result);
      }
    }
  } catch (error) {
    console.error('VNPay return confirmation error:', error);
  }

  const redirectUrl = new URL('/checkout/vnpay-result', clientUrl);
  redirectUrl.searchParams.set('checkout_ref', String(req.query.vnp_TxnRef || ''));
  redirectUrl.searchParams.set('response_code', String(req.query.vnp_ResponseCode || ''));
  redirectUrl.searchParams.set('signature_valid', String(signatureValid));
  return res.redirect(redirectUrl.toString());
};

exports.getVnpayPaymentStatus = asyncHandler(async (req, res) => {
  if (!CHECKOUT_REF_PATTERN.test(req.params.checkoutRef)) {
    throw new AppError(400, 'Invalid VNPay checkout reference.');
  }

  const payments = await Payment.findAll({
    where: {
      checkout_ref: req.params.checkoutRef,
      user_id: req.user.id,
      payment_method: 'VNPay',
    },
    include: [{ model: Course, attributes: ['id', 'title', 'thumbnail'] }],
    order: [['course_id', 'ASC']],
  });
  if (!payments.length) throw new AppError(404, 'VNPay checkout not found.');

  const statuses = new Set(payments.map((payment) => payment.status));
  const status = statuses.size === 1 ? payments[0].status : 'Pending';
  const totalMinor = payments.reduce((sum, payment) => sum + amountToMinorUnits(payment.amount), 0);

  res.json({
    checkout: {
      checkout_ref: req.params.checkoutRef,
      status,
      total: minorUnitsToAmount(totalMinor),
      response_code: payments[0].provider_response_code,
      transaction_no: payments[0].provider_transaction_no,
      paid_at: payments[0].paid_at,
      expires_at: payments[0].expires_at,
      items: payments.map((payment) => ({
        course_id: payment.course_id,
        title: payment.Course?.title,
        thumbnail: payment.Course?.thumbnail,
        amount: Number(payment.amount),
      })),
    },
  });
});
