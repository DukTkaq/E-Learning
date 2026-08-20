const {
  Category, Certificate, Course, Enrollment, Lesson, Question, Quiz,
  Review, User, sequelize,
} = require('../models');
const { randomUUID } = require('crypto');
const PDFDocument = require('pdfkit');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const CERTIFICATE_FONT_REGULAR = require.resolve('@fontsource/noto-sans/files/noto-sans-vietnamese-400-normal.woff');
const CERTIFICATE_FONT_BOLD = require.resolve('@fontsource/noto-sans/files/noto-sans-vietnamese-700-normal.woff');

const normalizeAnswer = (value) => String(value ?? '').trim().toUpperCase();

const calculateQuizResult = (questions, submittedAnswers, passingScore) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz has no questions to grade.');
  }
  if (!submittedAnswers || typeof submittedAnswers !== 'object' || Array.isArray(submittedAnswers)) {
    throw new Error('You must answer every question.');
  }

  const questionIds = new Set(questions.map((question) => String(question.id)));
  const answerIds = Object.keys(submittedAnswers);
  if (answerIds.some((id) => !questionIds.has(id))) {
    throw new Error('Submission contains an unknown question.');
  }
  if (answerIds.length !== questions.length
    || questions.some((question) => !normalizeAnswer(submittedAnswers[question.id]))) {
    throw new Error('You must answer every question.');
  }
  if (questions.some((question) => !['A', 'B', 'C', 'D'].includes(normalizeAnswer(submittedAnswers[question.id])))) {
    throw new Error('Every answer must be A, B, C, or D.');
  }

  const feedback = questions.map((question) => {
    const submitted = normalizeAnswer(submittedAnswers[question.id]);
    const correctAnswer = normalizeAnswer(question.correct_answer);
    return {
      question_id: String(question.id),
      submitted_answer: submitted,
      correct_answer: correctAnswer,
      correct: submitted === correctAnswer,
    };
  });
  const correctCount = feedback.filter((item) => item.correct).length;
  const percentage = Number(((correctCount / questions.length) * 100).toFixed(2));

  return {
    correctCount,
    questionCount: questions.length,
    score: Number((percentage / 10).toFixed(2)),
    percentage,
    passed: percentage >= Number(passingScore),
    feedback,
  };
};

const quizProgressFor = (lessonState, quiz) => {
  const progress = lessonState?.quiz;
  if (!progress || String(progress.quiz_id) !== String(quiz.id)) {
    return {
      quiz_id: String(quiz.id),
      watch_cycle: Number(lessonState?.watch_cycle) || 0,
      attempts_used: 0,
      passed: false,
    };
  }
  return progress;
};

const getQuizState = ({ lessonState = {}, quiz }) => {
  const watchCycle = Number(lessonState.watch_cycle) || 0;
  const progress = quizProgressFor(lessonState, quiz);
  const attemptsUsed = progress.watch_cycle === watchCycle ? Number(progress.attempts_used) || 0 : 0;
  const maxAttempts = Math.max(1, Number(quiz.max_attempts) || 3);
  const passed = Boolean(progress.passed);

  if (watchCycle <= 0) {
    return { watch_cycle: 0, attempts_used: 0, remaining_attempts: 0, passed: false, locked: true, lock_reason: 'WATCH_REQUIRED' };
  }
  if (passed) {
    return { watch_cycle: watchCycle, attempts_used: attemptsUsed, remaining_attempts: 0, passed: true, locked: true, lock_reason: 'PASSED' };
  }

  const remainingAttempts = Math.max(0, maxAttempts - attemptsUsed);
  return {
    watch_cycle: watchCycle,
    attempts_used: attemptsUsed,
    remaining_attempts: remainingAttempts,
    passed: false,
    locked: remainingAttempts === 0,
    lock_reason: remainingAttempts === 0 ? 'REWATCH_REQUIRED' : null,
  };
};

const recordLessonWatched = (lessonState = {}, quiz, watchedAt = new Date().toISOString()) => {
  const state = { ...lessonState };
  const quizState = quiz ? getQuizState({ lessonState: state, quiz }) : null;
  const shouldStartNextCycle = !state.watch_cycle || quizState?.lock_reason === 'REWATCH_REQUIRED';
  const watchCycle = shouldStartNextCycle ? (Number(state.watch_cycle) || 0) + 1 : Number(state.watch_cycle);

  return {
    ...state,
    completed_at: state.completed_at || watchedAt,
    last_watched_at: watchedAt,
    watch_cycle: watchCycle,
    ...(quiz && shouldStartNextCycle ? {
      quiz: {
        quiz_id: String(quiz.id),
        watch_cycle: watchCycle,
        attempts_used: 0,
        passed: false,
      },
    } : {}),
  };
};

const recordQuizAttempt = (lessonState = {}, quiz, grade, attemptedAt = new Date().toISOString()) => {
  const state = getQuizState({ lessonState, quiz });
  return {
    ...lessonState,
    quiz: {
      quiz_id: String(quiz.id),
      watch_cycle: state.watch_cycle,
      attempts_used: state.attempts_used + 1,
      passed: Boolean(grade.passed),
      last_score: grade.score,
      last_percentage: grade.percentage,
      last_attempt_at: attemptedAt,
    },
  };
};

const isCourseComplete = (lessons, quizzes, learningState = {}) => {
  const lessonStates = learningState.lessons || {};
  const quizByLesson = new Map((quizzes || []).map((quiz) => [String(quiz.lesson_id), quiz]));
  return lessons.length > 0 && lessons.every((lesson) => {
    const state = lessonStates[String(lesson.id)];
    if (!state?.completed_at) return false;
    const quiz = quizByLesson.get(String(lesson.id));
    return !quiz || (String(state.quiz?.quiz_id) === String(quiz.id) && state.quiz?.passed === true);
  });
};

const validateReviewInput = ({ rating, comment }) => {
  if (!Number.isInteger(rating)) throw new Error('Rating must be a whole number.');
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');
  const normalizedComment = String(comment || '').trim();
  if (!normalizedComment) throw new Error('Review comment is required.');
  if (normalizedComment.length > 2000) throw new Error('Review comment cannot exceed 2,000 characters.');
  return { rating, comment: normalizedComment };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requireUuid = (value, label) => {
  if (!UUID.test(String(value))) throw new AppError(400, `${label} must be a valid UUID.`);
};

const enrollmentState = (enrollment) => {
  const value = enrollment?.learning_state;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { lessons: {} };
  return { ...value, lessons: { ...(value.lessons || {}) } };
};

const publicCertificate = (certificate) => certificate ? {
  id: certificate.id,
  certificate_url: certificate.certificate_url,
  issued_date: certificate.issued_date,
} : null;

const buildCertificatePdf = ({ studentName, courseTitle, certificateId, issuedDate }) => new Promise((resolve, reject) => {
  const document = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 56 });
  const chunks = [];
  document.on('data', (chunk) => chunks.push(chunk));
  document.on('end', () => resolve(Buffer.concat(chunks)));
  document.on('error', reject);
  document.registerFont('NotoSans', CERTIFICATE_FONT_REGULAR);
  document.registerFont('NotoSansBold', CERTIFICATE_FONT_BOLD);
  document.rect(24, 24, 793, 547).lineWidth(3).stroke('#4f46e5');
  document.rect(34, 34, 773, 527).lineWidth(1).stroke('#0ea5e9');
  document.moveDown(2);
  document.font('NotoSansBold').fontSize(34).fillColor('#4f46e5').text('CERTIFICATE OF COMPLETION', { align: 'center' });
  document.moveDown(1.2);
  document.font('NotoSans').fontSize(17).fillColor('#334155').text('This certificate is proudly presented to', { align: 'center' });
  document.moveDown(0.7);
  document.font('NotoSansBold').fontSize(30).fillColor('#0f172a').text(String(studentName || ''), { align: 'center' });
  document.moveDown(0.8);
  document.font('NotoSans').fontSize(17).fillColor('#334155').text('for successfully completing the course', { align: 'center' });
  document.moveDown(0.7);
  document.font('NotoSansBold').fontSize(25).fillColor('#0ea5e9').text(String(courseTitle || ''), { align: 'center' });
  document.moveDown(1.5);
  document.font('NotoSans').fontSize(12).fillColor('#64748b').text(`Issued: ${new Date(issuedDate).toLocaleDateString('en-GB')}`, { align: 'center' });
  document.text(`Certificate ID: ${certificateId}`, { align: 'center' });
  document.end();
});

const loadEnrollment = async (userId, courseId, transaction) => {
  const enrollment = await Enrollment.findOne({
    where: { user_id: userId, course_id: courseId },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!enrollment) throw new AppError(403, 'You must be enrolled in this course.');
  const course = await Course.findOne({ where: { id: courseId, status: 'Approved' }, transaction });
  if (!course) throw new AppError(409, 'This course is not available for learning.');
  return { course, enrollment };
};

const lessonStates = async (enrollment, lessons) => {
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return [];
  const quizzes = await Quiz.findAll({ where: { lesson_id: lessonIds } });
  const learningState = enrollmentState(enrollment);
  const quizByLesson = new Map(quizzes.map((row) => [row.lesson_id, row]));
  return lessons.map((lesson) => {
    const progress = learningState.lessons[String(lesson.id)] || {};
    const quiz = quizByLesson.get(lesson.id);
    return {
      ...lesson.toJSON(),
      progress_percent: progress.completed_at ? 100 : 0,
      completed_at: progress.completed_at || null,
      quiz: quiz ? {
        id: quiz.id,
        title: quiz.title,
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts,
        ...getQuizState({ lessonState: progress, quiz }),
      } : null,
    };
  });
};

const issueCertificateIfEligible = async ({ userId, courseId, enrollment, transaction }) => {
  const existing = await Certificate.findOne({ where: { user_id: userId, course_id: courseId }, transaction });
  if (existing) return existing;

  const lessons = await Lesson.findAll({ where: { course_id: courseId }, transaction });
  const lessonIds = lessons.map((lesson) => lesson.id);
  const quizzes = lessonIds.length ? await Quiz.findAll({ where: { lesson_id: lessonIds }, transaction }) : [];
  if (!isCourseComplete(lessons, quizzes, enrollmentState(enrollment))) return null;

  const certificateId = randomUUID();
  const [certificate] = await Certificate.findOrCreate({
    where: { user_id: userId, course_id: courseId },
    defaults: {
      id: certificateId,
      user_id: userId,
      course_id: courseId,
      certificate_url: `/api/learning/certificates/${certificateId}/download`,
      issued_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    transaction,
  });
  return certificate;
};

exports.courseDetail = asyncHandler(async (req, res) => {
  requireUuid(req.params.courseId, 'Course ID');
  const { course, enrollment } = await loadEnrollment(req.user.id, req.params.courseId);
  const [lessons, review] = await Promise.all([
    Lesson.findAll({ where: { course_id: course.id }, order: [['order_index', 'ASC'], ['created_at', 'ASC']] }),
    Review.findOne({ where: { user_id: req.user.id, course_id: course.id } }),
  ]);
  const certificate = await issueCertificateIfEligible({
    userId: req.user.id,
    courseId: course.id,
    enrollment,
  });
  res.json({
    course: {
      ...course.toJSON(),
      enrollment: { id: enrollment.id, progress: enrollment.progress || 0, enrolled_at: enrollment.created_at },
      lessons: await lessonStates(enrollment, lessons),
      review,
      certificate: publicCertificate(certificate),
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
  const { enrollment } = await loadEnrollment(req.user.id, lesson.course_id);
  const lessons = await Lesson.findAll({ where: { course_id: lesson.course_id }, order: [['order_index', 'ASC']] });
  const states = await lessonStates(enrollment, lessons);
  res.json({ lesson: { ...lesson.toJSON(), learning_state: states.find((item) => item.id === lesson.id), course_lessons: states } });
});

exports.completeLesson = asyncHandler(async (req, res) => {
  requireUuid(req.params.lessonId, 'Lesson ID');
  const result = await sequelize.transaction(async (transaction) => {
    const lesson = await Lesson.findByPk(req.params.lessonId, { transaction });
    if (!lesson) throw new AppError(404, 'Lesson not found.');
    const { enrollment } = await loadEnrollment(req.user.id, lesson.course_id, transaction);
    const quiz = await Quiz.findOne({ where: { lesson_id: lesson.id }, transaction });
    const now = new Date();
    const learningState = enrollmentState(enrollment);
    const lessonKey = String(lesson.id);
    learningState.lessons[lessonKey] = recordLessonWatched(
      learningState.lessons[lessonKey] || {},
      quiz,
      now.toISOString(),
    );

    const lessons = await Lesson.findAll({ where: { course_id: lesson.course_id }, transaction });
    const completedCount = lessons.filter((item) => learningState.lessons[String(item.id)]?.completed_at).length;
    const enrollmentProgress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
    await enrollment.update({ learning_state: learningState, progress: enrollmentProgress, updated_at: now }, { transaction });
    const certificate = await issueCertificateIfEligible({
      userId: req.user.id,
      courseId: lesson.course_id,
      enrollment,
      transaction,
    });
    const progress = learningState.lessons[lessonKey];
    return {
      progress,
      enrollmentProgress,
      quizState: quiz ? getQuizState({ lessonState: progress, quiz }) : null,
      certificate,
    };
  });
  res.json({
    message: 'Lesson completion recorded.',
    progress: { ...result.progress, progress_percent: 100, enrollment_progress: result.enrollmentProgress },
    quiz: result.quizState,
    certificate: publicCertificate(result.certificate),
  });
});

exports.getQuiz = asyncHandler(async (req, res) => {
  requireUuid(req.params.lessonId, 'Lesson ID');
  const lesson = await Lesson.findByPk(req.params.lessonId);
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  const { enrollment } = await loadEnrollment(req.user.id, lesson.course_id);
  const quiz = await Quiz.findOne({ where: { lesson_id: lesson.id } });
  if (!quiz) throw new AppError(404, 'This lesson does not have a quiz.');
  const questions = await Question.findAll({
    where: { quiz_id: quiz.id },
    attributes: ['id', 'content', 'option_a', 'option_b', 'option_c', 'option_d'],
    order: [['created_at', 'ASC']],
  });
  const lessonState = enrollmentState(enrollment).lessons[String(lesson.id)] || {};
  res.json({
    quiz: {
      ...quiz.toJSON(),
      questions,
      ...getQuizState({ lessonState, quiz }),
    },
  });
});

exports.submitQuiz = asyncHandler(async (req, res) => {
  requireUuid(req.params.quizId, 'Quiz ID');
  const response = await sequelize.transaction(async (transaction) => {
    const quiz = await Quiz.findByPk(req.params.quizId, { include: [{ model: Lesson }], transaction });
    if (!quiz) throw new AppError(404, 'Quiz not found.');
    const { enrollment } = await loadEnrollment(req.user.id, quiz.Lesson.course_id, transaction);
    const learningState = enrollmentState(enrollment);
    const lessonKey = String(quiz.lesson_id);
    const lessonState = learningState.lessons[lessonKey] || {};
    const state = getQuizState({ lessonState, quiz });
    if (state.locked) {
      const messages = {
        WATCH_REQUIRED: 'Watch this lesson to the end before taking its quiz.',
        REWATCH_REQUIRED: `You used all ${quiz.max_attempts} attempts. Rewatch the lesson to unlock more attempts.`,
        PASSED: 'You already passed this quiz.',
      };
      throw new AppError(409, messages[state.lock_reason]);
    }
    const questions = await Question.findAll({ where: { quiz_id: quiz.id }, order: [['created_at', 'ASC']], transaction });
    let grade;
    try { grade = calculateQuizResult(questions, req.body?.answers, quiz.passing_score); } catch (error) { throw new AppError(400, error.message); }

    const attemptedAt = new Date();
    const updatedLessonState = recordQuizAttempt(lessonState, quiz, grade, attemptedAt.toISOString());
    learningState.lessons[lessonKey] = updatedLessonState;
    await enrollment.update({ learning_state: learningState, updated_at: attemptedAt }, { transaction });
    const certificate = grade.passed ? await issueCertificateIfEligible({
      userId: req.user.id,
      courseId: quiz.Lesson.course_id,
      enrollment,
      transaction,
    }) : null;
    const updatedState = getQuizState({ lessonState: updatedLessonState, quiz });
    return {
      attempt: {
        watch_cycle: updatedState.watch_cycle,
        attempt_number: updatedState.attempts_used,
        correct_count: grade.correctCount,
        question_count: grade.questionCount,
        score: grade.score,
        percentage: grade.percentage,
        passed: grade.passed,
        created_at: attemptedAt,
      },
      grade,
      state: updatedState,
      certificate,
    };
  });
  res.status(201).json({
    attempt: { ...response.attempt, feedback: response.grade.feedback },
    quiz_state: response.state,
    certificate: publicCertificate(response.certificate),
  });
});

exports.downloadCertificate = asyncHandler(async (req, res) => {
  requireUuid(req.params.certificateId, 'Certificate ID');
  const certificate = await Certificate.findOne({
    where: { id: req.params.certificateId, user_id: req.user.id },
  });
  if (!certificate) throw new AppError(404, 'Certificate not found.');

  const [student, course] = await Promise.all([
    User.findByPk(req.user.id, { attributes: ['name'] }),
    Course.findByPk(certificate.course_id, { attributes: ['title'] }),
  ]);
  if (!student || !course) throw new AppError(404, 'Certificate information is unavailable.');

  const pdf = await buildCertificatePdf({
    studentName: student.name,
    courseTitle: course.title,
    certificateId: certificate.id,
    issuedDate: certificate.issued_date,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.id}.pdf"`);
  res.end(pdf);
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

exports.__test = {
  buildCertificatePdf,
  calculateQuizResult,
  getQuizState,
  isCourseComplete,
  recordQuizAttempt,
  recordLessonWatched,
  validateReviewInput,
};
