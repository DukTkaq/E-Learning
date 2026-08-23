const { Op } = require('sequelize');
const { Quiz, Question, Lesson, Course } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { canEditCourse, getCourseEditMessage } = require('../rules/courseStatusRules');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

const VALID_ANSWERS = ['A', 'B', 'C', 'D'];

const findOwnedLesson = async (courseId, lessonId, instructorId, requireEditable = false) => {
  const course = await Course.findOne({ where: { id: courseId, instructor_id: instructorId } });
  if (!course) throw new AppError(404, 'Course not found.');
  if (requireEditable && !canEditCourse(course.status)) {
    throw new AppError(409, getCourseEditMessage(course.status));
  }
  const lesson = await Lesson.findOne({ where: { id: lessonId, course_id: courseId } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  return lesson;
};

exports.getQuiz = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) return res.json({ quiz: null });

  const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
  const search = String(req.query.search || '').trim();
  const answer = String(req.query.answer || '').trim().toUpperCase();
  const where = { quiz_id: quiz.id };

  if (search) {
    where[Op.or] = ['content', 'option_a', 'option_b', 'option_c', 'option_d']
      .map((field) => ({ [field]: { [Op.iLike]: `%${search}%` } }));
  }
  if (answer) {
    if (!VALID_ANSWERS.includes(answer)) throw new AppError(400, 'Invalid correct answer filter.');
    where.correct_answer = answer;
  }

  const [{ count, rows: questions }, total] = await Promise.all([
    Question.findAndCountAll({
      where,
      order: [['created_at', 'ASC'], ['id', 'ASC']],
      limit: pagination.limit,
      offset: pagination.offset,
    }),
    Question.count({ where: { quiz_id: quiz.id } }),
  ]);

  res.json({
    quiz,
    questions,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: count,
    }),
    summary: { total },
  });
});

exports.createQuiz = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const existing = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (existing) throw new AppError(409, 'This lesson already has a quiz.');

  const { title, passing_score, max_attempts } = req.body;
  if (!title || !title.trim()) throw new AppError(400, 'Quiz title is required.');

  const score = parseInt(passing_score, 10);
  if (isNaN(score) || score < 1 || score > 100) throw new AppError(400, 'Passing score must be between 1 and 100.');

  const attempts = parseInt(max_attempts, 10);
  if (isNaN(attempts) || attempts < 1) throw new AppError(400, 'Max failed attempts must be at least 1.');

  const quiz = await Quiz.create({
    title: title.trim(),
    passing_score: score,
    max_attempts: attempts,
    lesson_id: lessonId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  res.status(201).json({ message: 'Quiz created successfully.', quiz });
});

exports.updateQuiz = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) throw new AppError(404, 'Quiz not found.');

  const { title, passing_score, max_attempts } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new AppError(400, 'Quiz title cannot be empty.');
    quiz.title = title.trim();
  }

  if (passing_score !== undefined) {
    const score = parseInt(passing_score, 10);
    if (isNaN(score) || score < 1 || score > 100) throw new AppError(400, 'Passing score must be between 1 and 100.');
    quiz.passing_score = score;
  }

  if (max_attempts !== undefined) {
    const attempts = parseInt(max_attempts, 10);
    if (isNaN(attempts) || attempts < 1) throw new AppError(400, 'Max failed attempts must be at least 1.');
    quiz.max_attempts = attempts;
  }

  quiz.updated_at = new Date();
  await quiz.save();
  res.json({ message: 'Quiz updated successfully.', quiz });
});

exports.deleteQuiz = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) throw new AppError(404, 'Quiz not found.');

  await Question.destroy({ where: { quiz_id: quiz.id } });
  await quiz.destroy();

  res.json({ message: 'Quiz deleted successfully.' });
});

exports.addQuestion = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) throw new AppError(404, 'Quiz not found.');

  const { content, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  if (!content || !content.trim()) throw new AppError(400, 'Question content is required.');
  if (!option_a || !option_a.trim()) throw new AppError(400, 'Option A is required.');
  if (!option_b || !option_b.trim()) throw new AppError(400, 'Option B is required.');
  if (!option_c || !option_c.trim()) throw new AppError(400, 'Option C is required.');
  if (!option_d || !option_d.trim()) throw new AppError(400, 'Option D is required.');
  if (!correct_answer || !VALID_ANSWERS.includes(correct_answer.toUpperCase())) {
    throw new AppError(400, 'Correct answer must be A, B, C, or D.');
  }

  const question = await Question.create({
    content: content.trim(),
    option_a: option_a.trim(),
    option_b: option_b.trim(),
    option_c: option_c.trim(),
    option_d: option_d.trim(),
    correct_answer: correct_answer.toUpperCase(),
    quiz_id: quiz.id,
    created_at: new Date(),
    updated_at: new Date(),
  });

  res.status(201).json({ message: 'Question added successfully.', question });
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const { courseId, lessonId, questionId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) throw new AppError(404, 'Quiz not found.');

  const question = await Question.findOne({ where: { id: questionId, quiz_id: quiz.id } });
  if (!question) throw new AppError(404, 'Question not found.');

  const { content, option_a, option_b, option_c, option_d, correct_answer } = req.body;

  if (content !== undefined) {
    if (!content.trim()) throw new AppError(400, 'Question content cannot be empty.');
    question.content = content.trim();
  }
  if (option_a !== undefined) {
    if (!option_a.trim()) throw new AppError(400, 'Option A cannot be empty.');
    question.option_a = option_a.trim();
  }
  if (option_b !== undefined) {
    if (!option_b.trim()) throw new AppError(400, 'Option B cannot be empty.');
    question.option_b = option_b.trim();
  }
  if (option_c !== undefined) {
    if (!option_c.trim()) throw new AppError(400, 'Option C cannot be empty.');
    question.option_c = option_c.trim();
  }
  if (option_d !== undefined) {
    if (!option_d.trim()) throw new AppError(400, 'Option D cannot be empty.');
    question.option_d = option_d.trim();
  }
  if (correct_answer !== undefined) {
    if (!VALID_ANSWERS.includes(correct_answer.toUpperCase())) {
      throw new AppError(400, 'Correct answer must be A, B, C, or D.');
    }
    question.correct_answer = correct_answer.toUpperCase();
  }

  question.updated_at = new Date();
  await question.save();
  res.json({ message: 'Question updated successfully.', question });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  const { courseId, lessonId, questionId } = req.params;
  await findOwnedLesson(courseId, lessonId, req.user.id, true);

  const quiz = await Quiz.findOne({ where: { lesson_id: lessonId } });
  if (!quiz) throw new AppError(404, 'Quiz not found.');

  const question = await Question.findOne({ where: { id: questionId, quiz_id: quiz.id } });
  if (!question) throw new AppError(404, 'Question not found.');

  await question.destroy();
  res.json({ message: 'Question deleted successfully.' });
});
