const { Op } = require('sequelize');
const {
  Cart,
  CartItem,
  Category,
  Course,
  Enrollment,
  User,
} = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const COURSE_INCLUDE = [
  { model: Category, attributes: ['id', 'name'] },
  { model: User, as: 'Instructor', attributes: ['id', 'name', 'avatar_url'] },
];

const parseCategoryId = (value) => {
  if (!value) return null;
  const categoryId = Number(value);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError(400, 'Category must be a positive integer.');
  }
  return categoryId;
};

const listCatalog = async (userId, filters = {}) => {
  const categoryId = parseCategoryId(filters.category_id);
  const search = String(filters.search || '').trim();
  const where = { status: 'Approved' };

  if (categoryId) where.category_id = categoryId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const [courses, cart, enrollments] = await Promise.all([
    Course.findAll({
      where,
      include: COURSE_INCLUDE,
      order: [['updated_at', 'DESC'], ['created_at', 'DESC']],
    }),
    Cart.findOne({
      where: { user_id: userId },
      include: [{ model: CartItem, attributes: ['course_id'] }],
    }),
    Enrollment.findAll({ where: { user_id: userId }, attributes: ['course_id'] }),
  ]);

  const cartCourseIds = new Set((cart?.CartItems || []).map((item) => item.course_id));
  const enrolledCourseIds = new Set(enrollments.map((item) => item.course_id));

  return courses.map((course) => ({
    ...course.toJSON(),
    in_cart: cartCourseIds.has(course.id),
    enrolled: enrolledCourseIds.has(course.id),
  }));
};

const listMyCourses = async (userId) => {
  const enrollments = await Enrollment.findAll({
    where: { user_id: userId },
    include: [{ model: Course, include: COURSE_INCLUDE }],
    order: [['created_at', 'DESC']],
  });

  return enrollments.map((enrollment) => ({
    enrollment_id: enrollment.id,
    enrolled_at: enrollment.created_at,
    progress: enrollment.progress || 0,
    course: enrollment.Course,
  }));
};

exports.list = asyncHandler(async (req, res) => {
  const courses = await listCatalog(req.user.id, req.query);
  res.json({ courses });
});

exports.mine = asyncHandler(async (req, res) => {
  const courses = await listMyCourses(req.user.id);
  res.json({ courses });
});
