const { Course, Category } = require('../models');
const AppError = require('../utils/AppError');

const COURSE_INCLUDE = [{ model: Category, attributes: ['id', 'name'] }];
const EDITABLE_FIELDS = ['title', 'description', 'thumbnail', 'price', 'category_id'];

const validateCoursePayload = async (payload, { partial = false } = {}) => {
  const data = {};

  for (const field of EDITABLE_FIELDS) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  if (!partial || data.title !== undefined) {
    const title = String(data.title ?? '').trim();
    if (title.length < 3 || title.length > 200) {
      throw new AppError(400, 'Course title must be between 3 and 200 characters.');
    }
    data.title = title;
  }

  if (data.description !== undefined) {
    data.description = String(data.description ?? '').trim() || null;
    if (data.description && data.description.length > 5000) {
      throw new AppError(400, 'Course description must not exceed 5000 characters.');
    }
  }

  if (data.thumbnail !== undefined) {
    data.thumbnail = String(data.thumbnail ?? '').trim() || null;
    const isLocalCourseThumbnail = data.thumbnail?.startsWith('/uploads/courses/');
    if (data.thumbnail && !isLocalCourseThumbnail) {
      try {
        new URL(data.thumbnail);
      } catch {
        throw new AppError(400, 'Thumbnail must be a valid URL.');
      }
    }
  }

  if (!partial || data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0 || price > 99999999.99) {
      throw new AppError(400, 'Course price must be between 0 and 99,999,999.99.');
    }
    data.price = price.toFixed(2);
  }

  if (!partial || data.category_id !== undefined) {
    const categoryId = Number(data.category_id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new AppError(400, 'A valid category is required.');
    }
    const categoryExists = await Category.count({ where: { id: categoryId } });
    if (!categoryExists) throw new AppError(404, 'Category not found.');
    data.category_id = categoryId;
  }

  if (partial && Object.keys(data).length === 0) {
    throw new AppError(400, 'At least one editable field is required.');
  }

  return data;
};

const findOwnedCourse = async (courseId, instructorId) => {
  const course = await Course.findOne({
    where: { id: courseId, instructor_id: instructorId },
    include: COURSE_INCLUDE,
  });
  if (!course) throw new AppError(404, 'Course not found.');
  return course;
};

const listCourses = (instructorId) => Course.findAll({
  where: { instructor_id: instructorId },
  include: COURSE_INCLUDE,
  order: [['updated_at', 'DESC'], ['created_at', 'DESC']],
});

const createCourse = async (instructorId, payload) => {
  const data = await validateCoursePayload(payload);
  const now = new Date();
  const course = await Course.create({
    ...data,
    instructor_id: instructorId,
    status: 'Pending',
    created_at: now,
    updated_at: now,
  });
  return findOwnedCourse(course.id, instructorId);
};

const updateCourse = async (courseId, instructorId, payload) => {
  const course = await findOwnedCourse(courseId, instructorId);
  if (course.status === 'Hidden') {
    throw new AppError(409, 'A hidden course cannot be edited.');
  }

  const data = await validateCoursePayload(payload, { partial: true });
  await course.update({
    ...data,
    status: ['Approved', 'Rejected'].includes(course.status) ? 'Pending' : course.status,
    updated_at: new Date(),
  });
  return findOwnedCourse(courseId, instructorId);
};

const hideCourse = async (courseId, instructorId) => {
  const course = await findOwnedCourse(courseId, instructorId);
  if (course.status !== 'Hidden') {
    await course.update({ status: 'Hidden', updated_at: new Date() });
  }
  return findOwnedCourse(courseId, instructorId);
};

module.exports = { listCourses, findOwnedCourse, createCourse, updateCourse, hideCourse };
