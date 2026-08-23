const { Op } = require('sequelize');
const { Lesson, Course, Quiz } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { canEditCourse, getCourseEditMessage } = require('../rules/courseStatusRules');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');
const fs = require('fs');
const path = require('path');

const findOwnedCourse = async (courseId, instructorId, requireEditable = false) => {
  const course = await Course.findOne({ where: { id: courseId, instructor_id: instructorId } });
  if (!course) throw new AppError(404, 'Course not found.');
  if (requireEditable && !canEditCourse(course.status)) {
    throw new AppError(409, getCourseEditMessage(course.status));
  }
  return course;
};

const getLessons = async (courseId) => {
  return Lesson.findAll({ where: { course_id: courseId }, order: [['order_index', 'ASC']] });
};

const MAX_LESSONS_PER_COURSE = 30;
const LESSON_TYPES = new Set(['regular', 'final']);
const QUIZ_FILTERS = new Set(['with_quiz', 'without_quiz']);

const buildLessonListWhere = async (courseId, filters = {}) => {
  const where = { course_id: courseId };
  const search = String(filters.search || '').trim();
  const type = String(filters.type || '').trim();
  const quiz = String(filters.quiz || '').trim();

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { video_url: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (type) {
    if (!LESSON_TYPES.has(type)) throw new AppError(400, 'Invalid lesson type filter.');
    where.is_final = type === 'final';
  }

  if (quiz) {
    if (!QUIZ_FILTERS.has(quiz)) throw new AppError(400, 'Invalid quiz availability filter.');
    const courseLessonIds = await Lesson.findAll({
      where: { course_id: courseId },
      attributes: ['id'],
      raw: true,
    });
    const quizRows = await Quiz.findAll({
      where: { lesson_id: { [Op.in]: courseLessonIds.map((lesson) => lesson.id) } },
      attributes: ['lesson_id'],
      raw: true,
    });
    const lessonIdsWithQuiz = quizRows.map((row) => row.lesson_id);
    where.id = quiz === 'with_quiz'
      ? { [Op.in]: lessonIdsWithQuiz }
      : { [Op.notIn]: lessonIdsWithQuiz };
  }

  return where;
};

exports.list = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id);
  const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const where = await buildLessonListWhere(req.params.courseId, req.query);
  const { count, rows } = await Lesson.findAndCountAll({
    where,
    include: [{ model: Quiz, attributes: ['id', 'title'] }],
    order: [['order_index', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  const [total, finalLesson, lastRegularOrder] = await Promise.all([
    Lesson.count({ where: { course_id: req.params.courseId } }),
    Lesson.findOne({
      where: { course_id: req.params.courseId, is_final: true },
      attributes: ['order_index'],
      raw: true,
    }),
    Lesson.max('order_index', { where: { course_id: req.params.courseId, is_final: false } }),
  ]);

  const lessons = rows.map((lesson) => ({
    ...lesson.toJSON(),
    can_move_up: !lesson.is_final && lesson.order_index > 0,
    can_move_down: !lesson.is_final && lesson.order_index < Number(lastRegularOrder),
  }));

  res.json({
    lessons,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: count,
    }),
    summary: {
      total,
      has_final: Boolean(finalLesson),
    },
  });
});

exports.create = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id, true);

  const { title, is_final, can_skip } = req.body;
  if (!title || !title.trim()) throw new AppError(400, 'Lesson title is required.');
  if (!req.file) throw new AppError(400, 'Video file is required.');

  const videoUrl = `/uploads/videos/${req.file.filename}`;
  const newCanSkip = can_skip === true || can_skip === 'true';

  const lessons = await getLessons(req.params.courseId);
  if (lessons.length >= MAX_LESSONS_PER_COURSE) {
    throw new AppError(400, `A course can only have up to ${MAX_LESSONS_PER_COURSE} lessons.`);
  }
  const newIsFinal = is_final === true || is_final === 'true';

  if (newIsFinal) {
    const existingFinal = lessons.find((l) => l.is_final);
    if (existingFinal) {
      await existingFinal.update({ is_final: false });
    }
  }

  const maxOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index)) : -1;
  let orderIndex;

  if (newIsFinal) {
    orderIndex = maxOrder + 1;
  } else {
    const existingFinal = lessons.find((l) => l.is_final);
    if (existingFinal) {
      orderIndex = existingFinal.order_index;
      existingFinal.order_index = maxOrder + 1;
      await existingFinal.save();
    } else {
      orderIndex = maxOrder + 1;
    }
  }

  const lesson = await Lesson.create({
    title: title.trim(),
    video_url: videoUrl,
    course_id: req.params.courseId,
    order_index: orderIndex,
    is_final: newIsFinal,
    can_skip: newCanSkip,
    created_at: new Date(),
    updated_at: new Date(),
  });

  res.status(201).json({ message: 'Lesson created successfully.', lesson });
});

exports.update = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id, true);

  const lesson = await Lesson.findOne({ where: { id: req.params.id, course_id: req.params.courseId } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  const { title, is_final, can_skip } = req.body;
  if (title !== undefined) {
    if (!title.trim()) throw new AppError(400, 'Lesson title cannot be empty.');
    lesson.title = title.trim();
  }

  if (can_skip !== undefined) {
    lesson.can_skip = can_skip === true || can_skip === 'true';
  }

  if (req.file) {
    const oldVideoUrl = lesson.video_url;
    lesson.video_url = `/uploads/videos/${req.file.filename}`;
    if (oldVideoUrl) {
      const oldPath = path.join(__dirname, '../../public', oldVideoUrl);
      fs.unlink(oldPath, () => {});
    }
  }

  if (is_final !== undefined) {
    const newIsFinal = is_final === true || is_final === 'true';
    if (newIsFinal && !lesson.is_final) {
      const lessons = await getLessons(req.params.courseId);
      const existingFinal = lessons.find((l) => l.is_final && l.id !== lesson.id);
      if (existingFinal) {
        await existingFinal.update({ is_final: false });
      }
      const nonFinal = lessons
        .filter((l) => l.id !== lesson.id)
        .sort((a, b) => a.order_index - b.order_index);
      for (let i = 0; i < nonFinal.length; i++) {
        if (nonFinal[i].order_index !== i) {
          nonFinal[i].order_index = i;
          await nonFinal[i].save();
        }
      }
      lesson.order_index = nonFinal.length;
      lesson.is_final = true;
    } else if (!newIsFinal && lesson.is_final) {
      lesson.is_final = false;
    }
  }

  lesson.updated_at = new Date();
  await lesson.save();
  res.json({ message: 'Lesson updated successfully.', lesson });
});

exports.remove = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id, true);

  const lesson = await Lesson.findOne({ where: { id: req.params.id, course_id: req.params.courseId } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  const deletedOrder = lesson.order_index;
  const videoUrl = lesson.video_url;
  await lesson.destroy();

  if (videoUrl) {
    const videoPath = path.join(__dirname, '../../public', videoUrl);
    fs.unlink(videoPath, () => {});
  }

  const remaining = await getLessons(req.params.courseId);
  for (const l of remaining) {
    if (l.order_index > deletedOrder) {
      l.order_index -= 1;
      l.updated_at = new Date();
      await l.save();
    }
  }

  res.json({ message: 'Lesson deleted successfully.' });
});

exports.moveUp = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id, true);

  const lesson = await Lesson.findOne({ where: { id: req.params.id, course_id: req.params.courseId } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (lesson.is_final) throw new AppError(400, 'The final lesson cannot be moved.');

  const lessons = await getLessons(req.params.courseId);
  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  if (currentIndex <= 0) throw new AppError(400, 'Lesson is already at the top.');

  const previous = lessons[currentIndex - 1];
  const tempOrder = lesson.order_index;
  lesson.order_index = previous.order_index;
  previous.order_index = tempOrder;
  lesson.updated_at = new Date();
  previous.updated_at = new Date();

  await Promise.all([lesson.save(), previous.save()]);
  const updated = await getLessons(req.params.courseId);
  res.json({ lessons: updated });
});

exports.moveDown = asyncHandler(async (req, res) => {
  await findOwnedCourse(req.params.courseId, req.user.id, true);

  const lesson = await Lesson.findOne({ where: { id: req.params.id, course_id: req.params.courseId } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (lesson.is_final) throw new AppError(400, 'The final lesson cannot be moved.');

  const lessons = await getLessons(req.params.courseId);
  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const next = lessons[currentIndex + 1];
  if (!next || next.is_final) throw new AppError(400, 'Lesson is already at the bottom.');

  const tempOrder = lesson.order_index;
  lesson.order_index = next.order_index;
  next.order_index = tempOrder;
  lesson.updated_at = new Date();
  next.updated_at = new Date();

  await Promise.all([lesson.save(), next.save()]);
  const updated = await getLessons(req.params.courseId);
  res.json({ lessons: updated });
});
