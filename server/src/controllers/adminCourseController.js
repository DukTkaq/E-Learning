const { Op } = require('sequelize');
const { Category, Course, User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');
const { getCourseReviewUpdate } = require('../rules/courseReviewRules');

const FILTER_STATUSES = new Set(['Pending', 'Approved', 'Rejected', 'Hidden']);

const COURSE_INCLUDE = [
  { model: Category, attributes: ['id', 'name'] },
  { model: User, as: 'Instructor', attributes: ['id', 'name', 'email'] },
];

const parseCategoryId = (value) => {
  if (!value) return null;
  const categoryId = Number(value);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError(400, 'Category must be a positive integer.');
  }
  return categoryId;
};

const listCourses = async (filters = {}) => {
  const pagination = parsePagination(filters, { defaultLimit: 6, maxLimit: 50 });
  const status = String(filters.status || '').trim();
  const search = String(filters.search || '').trim();
  const categoryId = parseCategoryId(filters.category_id);
  const where = {};

  if (status) {
    if (!FILTER_STATUSES.has(status)) throw new AppError(400, 'Invalid course status filter.');
    where.status = status;
  } else where.status = { [Op.ne]: 'Draft' };
  if (categoryId) where.category_id = categoryId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { '$Category.name$': { [Op.iLike]: `%${search}%` } },
      { '$Instructor.name$': { [Op.iLike]: `%${search}%` } },
      { '$Instructor.email$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows: courses } = await Course.findAndCountAll({
    where,
    include: COURSE_INCLUDE,
    order: [
      [Course.sequelize.literal("case when \"Course\".\"status\" = 'Pending' then 0 else 1 end"), 'ASC'],
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  return {
    courses,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: count,
    }),
  };
};

const reviewCourse = async (courseId, reviewPayload) => {
  const reviewUpdate = getCourseReviewUpdate(reviewPayload);
  const course = await Course.findByPk(courseId);
  if (!course) throw new AppError(404, 'Course not found.');
  if (course.status !== 'Pending') {
    throw new AppError(409, 'Only pending courses can be reviewed.');
  }

  await course.update({ ...reviewUpdate, updated_at: new Date() });
  return Course.findByPk(courseId, { include: COURSE_INCLUDE });
};

const hideCourse = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) throw new AppError(404, 'Course not found.');
  if (course.status === 'Hidden') throw new AppError(409, 'Course is already hidden.');

  await course.update({ status: 'Hidden', updated_at: new Date() });
  return Course.findByPk(courseId, { include: COURSE_INCLUDE });
};

exports.list = asyncHandler(async (req, res) => {
  res.json(await listCourses(req.query));
});

exports.review = asyncHandler(async (req, res) => {
  const course = await reviewCourse(req.params.id, req.body);
  res.json({ message: `Course ${course.status.toLowerCase()} successfully.`, course });
});

exports.hide = asyncHandler(async (req, res) => {
  const course = await hideCourse(req.params.id);
  res.json({ message: 'Course has been hidden/deleted due to violations.', course });
});
