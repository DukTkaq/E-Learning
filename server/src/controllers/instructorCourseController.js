const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { Op } = require('sequelize');
const { Course, Category, Lesson, Quiz, Question } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { canEditCourse, getCourseEditMessage } = require('../rules/courseStatusRules');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

const BUCKET_NAME = 'course-thumbnails';
const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${BUCKET_NAME}/`;
const COURSE_INCLUDE = [{ model: Category, attributes: ['id', 'name'] }];
const COURSE_DETAIL_INCLUDE = [
  ...COURSE_INCLUDE,
  {
    model: Lesson,
    attributes: ['id', 'title', 'video_url', 'order_index', 'is_final', 'created_at', 'updated_at'],
    required: false,
    include: [{
      model: Quiz,
      attributes: ['id', 'title', 'passing_score', 'max_attempts', 'created_at', 'updated_at'],
      required: false,
      include: [{
        model: Question,
        attributes: [
          'id', 'content', 'option_a', 'option_b', 'option_c', 'option_d',
          'correct_answer', 'created_at', 'updated_at',
        ],
        required: false,
      }],
    }],
  },
];
const COURSE_STATUSES = new Set(['Draft', 'Pending', 'Approved', 'Rejected', 'Hidden']);
const EDITABLE_FIELDS = ['title', 'description', 'thumbnail', 'price', 'category_id'];
const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

let storageClient;

const getStorageClient = () => {
  if (storageClient) return storageClient;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new AppError(
      503,
      'Course thumbnail storage is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY to server/.env.',
    );
  }

  storageClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return storageClient;
};

const uploadThumbnail = async (file, instructorId) => {
  if (!file) return null;

  const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
  const objectPath = `courses/${instructorId}/${crypto.randomUUID()}${extension}`;
  const client = getStorageClient();
  const { error } = await client.storage.from(BUCKET_NAME).upload(objectPath, file.buffer, {
    cacheControl: '3600',
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    console.error('Supabase course thumbnail upload failed:', error);
    throw new AppError(502, 'Could not upload the course thumbnail.');
  }

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
  return { objectPath, publicUrl: data.publicUrl };
};

const getThumbnailObjectPath = (thumbnail) => {
  if (!thumbnail) return null;

  try {
    const pathname = new URL(thumbnail).pathname;
    const markerIndex = pathname.indexOf(PUBLIC_OBJECT_MARKER);
    if (markerIndex < 0) return null;
    return decodeURIComponent(pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length));
  } catch {
    return null;
  }
};

const removeThumbnail = async (thumbnailOrObjectPath) => {
  const objectPath = thumbnailOrObjectPath?.startsWith('courses/')
    ? thumbnailOrObjectPath
    : getThumbnailObjectPath(thumbnailOrObjectPath);
  if (!objectPath) return;

  const { error } = await getStorageClient().storage.from(BUCKET_NAME).remove([objectPath]);
  if (error) throw error;
};

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

const findOwnedCourse = async (courseId, instructorId, { withCurriculum = false } = {}) => {
  const course = await Course.findOne({
    where: { id: courseId, instructor_id: instructorId },
    include: withCurriculum ? COURSE_DETAIL_INCLUDE : COURSE_INCLUDE,
    ...(withCurriculum ? {
      order: [
        [Lesson, 'order_index', 'ASC'],
        [Lesson, Quiz, Question, 'created_at', 'ASC'],
      ],
    } : {}),
  });
  if (!course) throw new AppError(404, 'Course not found.');
  return course;
};

const parseCategoryId = (value) => {
  if (!value) return null;
  const categoryId = Number(value);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError(400, 'Category must be a positive integer.');
  }
  return categoryId;
};

const listOwnedCourses = async (instructorId, filters = {}) => {
  const pagination = parsePagination(filters, { defaultLimit: 8, maxLimit: 50 });
  const search = String(filters.search || '').trim();
  const status = String(filters.status || '').trim();
  const categoryId = parseCategoryId(filters.category_id);
  const where = { instructor_id: instructorId };

  if (status) {
    if (!COURSE_STATUSES.has(status)) throw new AppError(400, 'Invalid course status filter.');
    where.status = status;
  }
  if (categoryId) where.category_id = categoryId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const [{ count, rows: courses }, totalCourses, hiddenCourses] = await Promise.all([
    Course.findAndCountAll({
      where,
      include: COURSE_INCLUDE,
      order: [['updated_at', 'DESC'], ['created_at', 'DESC'], ['id', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
    }),
    Course.count({ where: { instructor_id: instructorId } }),
    Course.count({ where: { instructor_id: instructorId, status: 'Hidden' } }),
  ]);

  return {
    courses,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: count,
    }),
    summary: {
      active: totalCourses - hiddenCourses,
      total: totalCourses,
    },
  };
};

const createOwnedCourse = async (instructorId, payload) => {
  const data = await validateCoursePayload(payload);
  const now = new Date();
  const course = await Course.create({
    ...data,
    instructor_id: instructorId,
    status: 'Draft',
    created_at: now,
    updated_at: now,
  });
  return findOwnedCourse(course.id, instructorId);
};

const updateOwnedCourse = async (courseId, instructorId, payload) => {
  const course = await findOwnedCourse(courseId, instructorId);
  if (!canEditCourse(course.status)) {
    throw new AppError(409, getCourseEditMessage(course.status));
  }

  const data = await validateCoursePayload(payload, { partial: true });
  await course.update({
    ...data,
    updated_at: new Date(),
  });
  return findOwnedCourse(courseId, instructorId);
};

exports.list = asyncHandler(async (req, res) => {
  res.json(await listOwnedCourses(req.user.id, req.query));
});

exports.get = asyncHandler(async (req, res) => {
  const course = await findOwnedCourse(req.params.id, req.user.id, { withCurriculum: true });
  res.json({ course });
});

exports.create = asyncHandler(async (req, res) => {
  const uploadedThumbnail = await uploadThumbnail(req.file, req.user.id);
  try {
    const course = await createOwnedCourse(req.user.id, {
      ...req.body,
      ...(uploadedThumbnail ? { thumbnail: uploadedThumbnail.publicUrl } : {}),
    });
    res.status(201).json({ message: 'Course draft created.', course });
  } catch (error) {
    if (uploadedThumbnail) {
      removeThumbnail(uploadedThumbnail.objectPath).catch((cleanupError) => {
        console.error('Could not remove the unused course thumbnail:', cleanupError);
      });
    }
    throw error;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const uploadedThumbnail = await uploadThumbnail(req.file, req.user.id);
  let existingCourse;
  let course;
  try {
    existingCourse = await findOwnedCourse(req.params.id, req.user.id);
    course = await updateOwnedCourse(req.params.id, req.user.id, {
      ...req.body,
      ...(uploadedThumbnail ? { thumbnail: uploadedThumbnail.publicUrl } : {}),
    });
  } catch (error) {
    if (uploadedThumbnail) {
      removeThumbnail(uploadedThumbnail.objectPath).catch((cleanupError) => {
        console.error('Could not remove the unused course thumbnail:', cleanupError);
      });
    }
    throw error;
  }

  if (uploadedThumbnail && existingCourse.thumbnail !== uploadedThumbnail.publicUrl) {
    removeThumbnail(existingCourse.thumbnail).catch((error) => {
      console.error('Could not remove previous course thumbnail:', error);
    });
  }
  res.json({ message: 'Course updated successfully.', course });
});

exports.hide = asyncHandler(async (req, res) => {
  const course = await findOwnedCourse(req.params.id, req.user.id);
  if (course.status === 'Pending') {
    throw new AppError(409, 'A pending course cannot be hidden until Admin reviews it.');
  }
  if (course.status !== 'Hidden') {
    await course.update({ status: 'Hidden', updated_at: new Date() });
  }
  const hiddenCourse = await findOwnedCourse(req.params.id, req.user.id);
  res.json({ message: 'Course hidden successfully.', course: hiddenCourse });
});
