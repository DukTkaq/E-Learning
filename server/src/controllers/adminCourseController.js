const { Op } = require('sequelize');
const { Category, Course, User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const FILTER_STATUSES = new Set(['Pending', 'Approved', 'Rejected', 'Hidden']);
const REVIEW_STATUSES = new Set(['Approved', 'Rejected']);

const COURSE_INCLUDE = [
  { model: Category, attributes: ['id', 'name'] },
  { model: User, as: 'Instructor', attributes: ['id', 'name', 'email'] },
];

const listCourses = (filters = {}) => {
  const status = String(filters.status || '').trim();
  const search = String(filters.search || '').trim();
  const where = {};

  if (status) {
    if (!FILTER_STATUSES.has(status)) throw new AppError(400, 'Invalid course status filter.');
    where.status = status;
  } else where.status = { [Op.ne]: 'Draft' };
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  return Course.findAll({
    where,
    include: COURSE_INCLUDE,
    order: [
      [Course.sequelize.literal("case when \"Course\".\"status\" = 'Pending' then 0 else 1 end"), 'ASC'],
      ['updated_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });
};

const reviewCourse = async (courseId, status) => {
  if (!REVIEW_STATUSES.has(status)) {
    throw new AppError(400, 'Course can only be approved or rejected.');
  }

  const course = await Course.findByPk(courseId);
  if (!course) throw new AppError(404, 'Course not found.');
  if (course.status !== 'Pending') {
    throw new AppError(409, 'Only pending courses can be reviewed.');
  }

  await course.update({ status, updated_at: new Date() });
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
  const courses = await listCourses(req.query);
  res.json({ courses });
});

exports.review = asyncHandler(async (req, res) => {
  const course = await reviewCourse(req.params.id, req.body.status);
  res.json({ message: `Course ${course.status.toLowerCase()} successfully.`, course });
});

exports.hide = asyncHandler(async (req, res) => {
  const course = await hideCourse(req.params.id);
  res.json({ message: 'Course has been hidden/deleted due to violations.', course });
});
