const { Coupon, Course } = require('../models');

// [GET] /api/instructor/vouchers
exports.getVouchers = async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    const vouchers = await Coupon.findAll({
      where: { instructor_id: instructorId },
      include: [
        {
          model: Course,
          attributes: ['id', 'title'] // just need course title for display
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Internal server error while fetching vouchers' });
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
