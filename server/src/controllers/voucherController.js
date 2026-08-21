const { Coupon, Course } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

const DISCOUNT_RANGES = {
  low: [1, 20],
  medium: [21, 50],
  high: [51, 100],
};

const buildVoucherWhere = (instructorId, filters) => {
  const where = { instructor_id: instructorId };
  const search = String(filters.search || '').trim();
  const scope = String(filters.scope || '').trim();
  const discount = String(filters.discount || '').trim();

  if (scope === 'all_courses') where.course_id = { [Op.is]: null };
  else if (scope === 'specific_course') where.course_id = { [Op.not]: null };
  else if (scope) throw new AppError(400, 'Invalid voucher scope filter.');

  if (discount) {
    const range = DISCOUNT_RANGES[discount];
    if (!range) throw new AppError(400, 'Invalid discount filter.');
    where.discount_percent = { [Op.between]: range };
  }

  if (search) {
    where[Op.or] = [
      { code: { [Op.iLike]: `%${search}%` } },
      { '$Course.title$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  return where;
};

exports.__test = { buildVoucherWhere };

// [GET] /api/instructor/vouchers
exports.getVouchers = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const pagination = parsePagination(req.query, { defaultLimit: 8, maxLimit: 50 });
    const where = buildVoucherWhere(instructorId, req.query);
    const include = [{ model: Course, attributes: ['id', 'title'], required: false }];

    const [{ count, rows: vouchers }, total] = await Promise.all([
      Coupon.findAndCountAll({
        where,
        include,
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        limit: pagination.limit,
        offset: pagination.offset,
        distinct: true,
      }),
      Coupon.count({ where: { instructor_id: instructorId } }),
    ]);

    res.status(200).json({
      vouchers,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
      }),
      summary: { total },
    });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    console.error('Error fetching vouchers:', error);
    return res.status(500).json({ message: 'Internal server error while fetching vouchers' });
  }
};

// [POST] /api/instructor/vouchers
exports.createVoucher = async (req, res) => {
  try {
    const { code, discount_percent, course_id } = req.body;
    const instructorId = req.user.id;

    // Basic Validation
    if (!code || !discount_percent) {
      return res.status(400).json({ message: 'Code and discount percent are required.' });
    }

    if (discount_percent < 1 || discount_percent > 100) {
      return res.status(400).json({ message: 'Discount must be between 1 and 100.' });
    }

    // Check code uniqueness
    const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Voucher code already exists.' });
    }

    // Check course existence and ownership if course_id is provided
    if (course_id) {
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
      }
      if (course.instructor_id !== instructorId) {
        return res.status(403).json({ message: 'You do not own this course.' });
      }
    }

    // Create Voucher
    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discount_percent,
      instructor_id: instructorId,
      course_id: course_id || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      message: 'Voucher created successfully!',
      coupon: newCoupon
    });

  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ message: 'Internal server error while creating voucher' });
  }
};

// [DELETE] /api/instructor/vouchers/:id
exports.deleteVoucher = async (req, res) => {
  try {
    const voucherId = req.params.id;
    const instructorId = req.user.id;

    // 1. Find voucher
    const voucher = await Coupon.findByPk(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found.' });
    }

    // 2. Check ownership
    if (voucher.instructor_id !== instructorId) {
      return res.status(403).json({ message: 'You do not have permission to delete this voucher.' });
    }

    // 3. Check if used in payments
    const { Payment } = require('../models');
    const paymentUsingVoucher = await Payment.findOne({ where: { coupon_id: voucherId } });
    if (paymentUsingVoucher) {
      return res.status(400).json({ message: 'Cannot delete voucher because it has already been used by a student.' });
    }

    // 4. Delete
    await voucher.destroy();

    res.status(200).json({ message: 'Voucher deleted successfully.' });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({ message: 'Internal server error while deleting voucher.' });
  }
};
