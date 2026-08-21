const { Op } = require('sequelize');
const {
  Cart,
  CartItem,
  Category,
  Course,
  Enrollment,
  Lesson,
  Review,
  User,
} = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const pagination = parsePagination(filters);
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

  const { count, rows: courses } = await Course.findAndCountAll({
    where,
    include: COURSE_INCLUDE,
    order: [['updated_at', 'DESC'], ['created_at', 'DESC'], ['id', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  const metadata = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: count,
  });

  if (!userId) {
    return {
      courses: courses.map((course) => ({ ...course.toJSON(), in_cart: false, enrolled: false })),
      pagination: metadata,
    };
  }

  const [cart, enrollments] = await Promise.all([
    Cart.findOne({ where: { user_id: userId }, include: [{ model: CartItem, attributes: ['course_id'] }] }),
    Enrollment.findAll({ where: { user_id: userId }, attributes: ['course_id'] }),
  ]);

  const cartCourseIds = new Set((cart?.CartItems || []).map((item) => item.course_id));
  const enrolledCourseIds = new Set(enrollments.map((item) => item.course_id));

  return {
    courses: courses.map((course) => ({
      ...course.toJSON(),
      in_cart: cartCourseIds.has(course.id),
      enrolled: enrolledCourseIds.has(course.id),
    })),
    pagination: metadata,
  };
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
  const result = await listCatalog(String(req.user?.role || '').toLowerCase() === 'student' ? req.user.id : null, req.query);
  res.json(result);
});

exports.mine = asyncHandler(async (req, res) => {
  const courses = await listMyCourses(req.user.id);
  res.json({ courses });
});

exports.detail = asyncHandler(async (req, res) => {
  if (!UUID.test(String(req.params.courseId))) throw new AppError(400, 'Course ID must be a valid UUID.');
  const course = await Course.findOne({
    where: { 
      id: req.params.courseId, 
      ...(req.user?.role === 'Admin' ? {} : { status: 'Approved' })
    },
    include: [
      ...COURSE_INCLUDE,
      { model: Lesson, attributes: ['id', 'title', 'order_index'], required: false },
      { model: Review, required: false, include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }] },
    ],
    order: [[Lesson, 'order_index', 'ASC'], [Review, 'created_at', 'DESC']],
  });
  if (!course) throw new AppError(404, 'Course not found.');

  let inCart = false;
  let enrolled = false;
  if (String(req.user?.role || '').toLowerCase() === 'student') {
    const [cartItem, enrollment] = await Promise.all([
      CartItem.findOne({ include: [{ model: Cart, where: { user_id: req.user.id } }], where: { course_id: course.id } }),
      Enrollment.findOne({ where: { user_id: req.user.id, course_id: course.id } }),
    ]);
    inCart = Boolean(cartItem);
    enrolled = Boolean(enrollment);
  }

  const json = course.toJSON();
  const ratings = (json.Reviews || []).map((review) => Number(review.rating));
  res.json({ course: {
    ...json,
    Lessons: (json.Lessons || []).sort((a, b) => a.order_index - b.order_index),
    rating_average: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)) : 0,
    rating_count: ratings.length,
    in_cart: inCart,
    enrolled,
  } });
});
