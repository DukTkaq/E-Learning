const {
  Category, Course, Enrollment, Lesson, LessonProgress, Question, Quiz, QuizAttempt,
  Review, User, sequelize,
} = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { calculateQuizResult, getQuizState, nextWatchCycle, validateReviewInput } = require('../services/learningRules');
const { canEnrolledStudentLearn } = require('../rules/courseStatusRules');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requireUuid = (value, label) => {
  if (!UUID.test(String(value))) throw new AppError(400, `${label} must be a valid UUID.`);
};

const loadEnrollment = async (userId, courseId, transaction) => {
  const enrollment = await Enrollment.findOne({
    where: { user_id: userId, course_id: courseId },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!enrollment) throw new AppError(403, 'You must be enrolled in this course.');
  const course = await Course.findByPk(courseId, { transaction });
  if (!course || !canEnrolledStudentLearn(course.status)) {
    throw new AppError(409, 'This course is not available for learning.');
  }
  return { course, enrollment };
};

const lessonStates = async (userId, lessons) => {
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return [];
  const [progressRows, quizzes, attempts] = await Promise.all([
    LessonProgress.findAll({ where: { user_id: userId, lesson_id: lessonIds } }),
    Quiz.findAll({ where: { lesson_id: lessonIds } }),
    QuizAttempt.findAll({ where: { user_id: userId, lesson_id: lessonIds }, order: [['created_at', 'DESC']] }),
  ]);
  const progressByLesson = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const quizByLesson = new Map(quizzes.map((row) => [row.lesson_id, row]));
  return lessons.map((lesson) => {
    const progress = progressByLesson.get(lesson.id);
    const quiz = quizByLesson.get(lesson.id);
    const quizAttempts = attempts.filter((attempt) => attempt.lesson_id === lesson.id);
    return {
      ...lesson.toJSON(),
      progress_percent: progress?.progress_percent || 0,
      completed_at: progress?.completed_at || null,
      quiz: quiz ? { id: quiz.id, title: quiz.title, ...getQuizState({ watchCycle: progress?.watch_cycle || 0, attempts: quizAttempts }) } : null,
    };
  });
};

exports.courseDetail = asyncHandler(async (req, res) => {
  requireUuid(req.params.courseId, 'Course ID');
  const { course, enrollment } = await loadEnrollment(req.user.id, req.params.courseId);
  const [lessons, review] = await Promise.all([
    Lesson.findAll({ where: { course_id: course.id }, order: [['order_index', 'ASC'], ['created_at', 'ASC']] }),
    Review.findOne({ where: { user_id: req.user.id, course_id: course.id } }),
  ]);
  res.json({
    course: {
      ...course.toJSON(),
      enrollment: { id: enrollment.id, progress: enrollment.progress || 0, enrolled_at: enrollment.created_at },
      lessons: await lessonStates(req.user.id, lessons),
      review,
    },
  });
});

exports.lessonDetail = asyncHandler(async (req, res) => {
  requireUuid(req.params.lessonId, 'Lesson ID');
  const lesson = await Lesson.findByPk(req.params.lessonId, {
    include: [{ model: Course, include: [
      { model: Category, attributes: ['id', 'name'] },
      { model: User, as: 'Instructor', attributes: ['id', 'name'] },
    ] }],
  });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  await loadEnrollment(req.user.id, lesson.course_id);
  const lessons = await Lesson.findAll({ where: { course_id: lesson.course_id }, order: [['order_index', 'ASC']] });
  const states = await lessonStates(req.user.id, lessons);
  res.json({ lesson: { ...lesson.toJSON(), learning_state: states.find((item) => item.id === lesson.id), course_lessons: states } });
});

exports.completeLesson = asyncHandler(async (req, res) => {
  requireUuid(req.params.lessonId, 'Lesson ID');
  const result = await sequelize.transaction(async (transaction) => {
    const lesson = await Lesson.findByPk(req.params.lessonId, { transaction });
    if (!lesson) throw new AppError(404, 'Lesson not found.');
    const { enrollment } = await loadEnrollment(req.user.id, lesson.course_id, transaction);
    const [progress] = await LessonProgress.findOrCreate({
      where: { user_id: req.user.id, lesson_id: lesson.id },
      defaults: { user_id: req.user.id, course_id: lesson.course_id, lesson_id: lesson.id, created_at: new Date(), updated_at: new Date() },
      transaction,
    });
    await progress.reload({ transaction, lock: transaction.LOCK.UPDATE });
    const quiz = await Quiz.findOne({ where: { lesson_id: lesson.id }, transaction });
    const attempts = quiz ? await QuizAttempt.findAll({ where: { user_id: req.user.id, quiz_id: quiz.id }, transaction, lock: transaction.LOCK.UPDATE }) : [];
    const now = new Date();
    await progress.update({
      progress_percent: 100,
      completed_at: progress.completed_at || now,
      last_watched_at: now,
      watch_cycle: nextWatchCycle({ watchCycle: progress.watch_cycle, attempts }),
      updated_at: now,
    }, { transaction });

    const lessonCount = await Lesson.count({ where: { course_id: lesson.course_id }, transaction });
    const completedCount = await LessonProgress.count({ where: { user_id: req.user.id, course_id: lesson.course_id, progress_percent: 100 }, transaction });
    const enrollmentProgress = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;
    await enrollment.update({ progress: enrollmentProgress, updated_at: now }, { transaction });
    return { progress, enrollmentProgress, quizState: quiz ? getQuizState({ watchCycle: progress.watch_cycle, attempts }) : null };
  });
  res.json({ message: 'Lesson completion recorded.', progress: { ...result.progress.toJSON(), enrollment_progress: result.enrollmentProgress }, quiz: result.quizState });
});

exports.getQuiz = asyncHandler(async (req, res) => {
  requireUuid(req.params.lessonId, 'Lesson ID');
  const lesson = await Lesson.findByPk(req.params.lessonId);
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  await loadEnrollment(req.user.id, lesson.course_id);
  const quiz = await Quiz.findOne({ where: { lesson_id: lesson.id } });
  if (!quiz) throw new AppError(404, 'This lesson does not have a quiz.');
  const [questions, progress, attempts] = await Promise.all([
    Question.findAll({ where: { quiz_id: quiz.id }, attributes: ['id', 'content', 'option_a', 'option_b', 'option_c', 'option_d'], order: [['created_at', 'ASC']] }),
    LessonProgress.findOne({ where: { user_id: req.user.id, lesson_id: lesson.id } }),
    QuizAttempt.findAll({ where: { user_id: req.user.id, quiz_id: quiz.id }, attributes: ['id', 'watch_cycle', 'attempt_number', 'score', 'passed', 'created_at'], order: [['created_at', 'DESC']] }),
  ]);
  res.json({ quiz: { ...quiz.toJSON(), questions, attempts, ...getQuizState({ watchCycle: progress?.watch_cycle || 0, attempts }) } });
});

exports.submitQuiz = asyncHandler(async (req, res) => {
  requireUuid(req.params.quizId, 'Quiz ID');
  const response = await sequelize.transaction(async (transaction) => {
    const quiz = await Quiz.findByPk(req.params.quizId, { include: [{ model: Lesson }], transaction });
    if (!quiz) throw new AppError(404, 'Quiz not found.');
    await loadEnrollment(req.user.id, quiz.Lesson.course_id, transaction);
    const progress = await LessonProgress.findOne({ where: { user_id: req.user.id, lesson_id: quiz.lesson_id }, transaction, lock: transaction.LOCK.UPDATE });
    const attempts = await QuizAttempt.findAll({ where: { user_id: req.user.id, quiz_id: quiz.id }, transaction, lock: transaction.LOCK.UPDATE });
    const state = getQuizState({ watchCycle: progress?.watch_cycle || 0, attempts });
    if (state.locked) {
      const messages = { WATCH_REQUIRED: 'Watch this lesson to the end before taking its quiz.', REWATCH_REQUIRED: 'You used all three attempts. Rewatch the lesson to unlock three more.', PASSED: 'You already passed this quiz.' };
      throw new AppError(409, messages[state.lock_reason]);
    }
    const questions = await Question.findAll({ where: { quiz_id: quiz.id }, order: [['created_at', 'ASC']], transaction });
    let grade;
    try { grade = calculateQuizResult(questions, req.body?.answers); } catch (error) { throw new AppError(400, error.message); }
    let attempt;
    try {
      attempt = await QuizAttempt.create({
        user_id: req.user.id, course_id: quiz.Lesson.course_id, lesson_id: quiz.lesson_id, quiz_id: quiz.id,
        watch_cycle: state.watch_cycle, attempt_number: state.attempts_used + 1,
        correct_count: grade.correctCount, question_count: grade.questionCount, score: grade.score,
        passed: grade.passed, answers: req.body.answers, created_at: new Date(),
      }, { transaction });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') throw new AppError(409, 'This quiz attempt was already submitted. Refresh and try again.');
      throw error;
    }
    return { attempt, grade, state: getQuizState({ watchCycle: state.watch_cycle, attempts: [...attempts, attempt] }) };
  });
  res.status(201).json({ attempt: { ...response.attempt.toJSON(), feedback: response.grade.feedback }, quiz_state: response.state });
});

exports.createReview = asyncHandler(async (req, res) => {
  requireUuid(req.params.courseId, 'Course ID');
  let input;
  try { input = validateReviewInput(req.body || {}); } catch (error) { throw new AppError(400, error.message); }
  await loadEnrollment(req.user.id, req.params.courseId);
  if (await Review.findOne({ where: { user_id: req.user.id, course_id: req.params.courseId } })) throw new AppError(409, 'You have already reviewed this course.');
  try {
    const review = await Review.create({ ...input, user_id: req.user.id, course_id: req.params.courseId, created_at: new Date(), updated_at: new Date() });
    res.status(201).json({ message: 'Review published.', review });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') throw new AppError(409, 'You have already reviewed this course.');
    throw error;
  }
});
