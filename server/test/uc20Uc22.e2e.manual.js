const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { randomUUID } = require('node:crypto');

const {
  Certificate,
  Course,
  Enrollment,
  Lesson,
  Question,
  Quiz,
  Role,
  User,
  sequelize,
} = require('../src/models');

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000/api';
const runId = randomUUID();
const email = `codex-uc20-${runId}@example.test`;
const otherEmail = `codex-uc22-other-${runId}@example.test`;
const password = 'TestStudent2026';

let testUser;
let otherUser;
let testEnrollment;
let testCourse;
let originalCourseStatus;

const request = async (path, { token, expectedStatus = 200, ...options } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${path} returned ${response.status}: ${Buffer.isBuffer(body) ? '<binary>' : JSON.stringify(body)}`,
  );
  return { response, body };
};

const answerMap = (questions, correct) => Object.fromEntries(questions.map((question) => {
  const answer = String(question.correct_answer).toUpperCase();
  return [question.id, correct ? answer : (answer === 'A' ? 'B' : 'A')];
}));

const cleanup = async () => {
  const failures = [];
  const steps = [
    async () => {
      if (testCourse && originalCourseStatus) {
        await Course.update({ status: originalCourseStatus }, { where: { id: testCourse.id } });
      }
    },
    async () => {
      if (testUser && testCourse) {
        await Certificate.destroy({ where: { user_id: testUser.id, course_id: testCourse.id } });
      }
    },
    async () => {
      if (testEnrollment) await Enrollment.destroy({ where: { id: testEnrollment.id } });
    },
    async () => {
      if (testUser) await User.destroy({ where: { id: testUser.id } });
    },
    async () => {
      if (otherUser) await User.destroy({ where: { id: otherUser.id } });
    },
  ];
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) throw new AggregateError(failures, 'One or more E2E cleanup steps failed.');
};

const run = async () => {
  const studentRole = await Role.findOne({ where: { role_name: 'Student' } });
  assert.ok(studentRole, 'Student role must exist');

  const courses = await Course.findAll({ order: [['created_at', 'ASC']] });
  for (const candidate of courses) {
    const lessons = await Lesson.findAll({ where: { course_id: candidate.id } });
    if (!lessons.length) continue;
    const quizzes = await Quiz.findAll({ where: { lesson_id: lessons.map((lesson) => lesson.id) } });
    if (quizzes.length !== lessons.length) continue;
    const questionCounts = await Promise.all(quizzes.map((quiz) => Question.count({ where: { quiz_id: quiz.id } })));
    if (questionCounts.every((count) => count > 0)) {
      testCourse = candidate;
      break;
    }
  }
  assert.ok(testCourse, 'A course with a quiz and questions for every lesson is required');

  originalCourseStatus = testCourse.status;
  await testCourse.update({ status: 'Approved' });

  testUser = await User.create({
    id: randomUUID(),
    name: 'Codex UC20 Test Student',
    email,
    password: await bcrypt.hash(password, 10),
    role_id: studentRole.id,
    status: 'Active',
    created_at: new Date(),
  });
  otherUser = await User.create({
    id: randomUUID(),
    name: 'Codex UC22 Other Student',
    email: otherEmail,
    password: await bcrypt.hash(password, 10),
    role_id: studentRole.id,
    status: 'Active',
    created_at: new Date(),
  });
  testEnrollment = await Enrollment.create({
    id: randomUUID(),
    user_id: testUser.id,
    course_id: testCourse.id,
    progress: 0,
    learning_state: { lessons: {} },
    created_at: new Date(),
    updated_at: new Date(),
  });

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const token = login.body.token;
  assert.ok(token, 'Login must return a JWT');
  const otherLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: otherEmail, password }),
  });
  const otherToken = otherLogin.body.token;
  assert.ok(otherToken, 'The second Student login must return a JWT');

  const initialCourse = await request(`/learning/courses/${testCourse.id}`, { token });
  assert.equal(initialCourse.body.course.certificate, null);
  assert.ok(initialCourse.body.course.lessons.length > 0);

  const lessonRows = await Lesson.findAll({
    where: { course_id: testCourse.id },
    order: [['order_index', 'ASC'], ['created_at', 'ASC']],
  });

  let finalCertificate;
  const evidence = [];
  for (let lessonIndex = 0; lessonIndex < lessonRows.length; lessonIndex += 1) {
    const lesson = lessonRows[lessonIndex];
    const quiz = await Quiz.findOne({ where: { lesson_id: lesson.id } });
    const questions = await Question.findAll({ where: { quiz_id: quiz.id }, order: [['created_at', 'ASC']] });

    const beforeWatch = await request(`/learning/lessons/${lesson.id}/quiz`, { token });
    assert.equal(beforeWatch.body.quiz.locked, true);
    assert.equal(beforeWatch.body.quiz.lock_reason, 'WATCH_REQUIRED');

    if (lessonIndex === 0) {
      await request(`/learning/quizzes/${quiz.id}/attempts`, {
        token,
        method: 'POST',
        body: JSON.stringify({ answers: answerMap(questions, true) }),
        expectedStatus: 409,
      });
    }

    const watched = await request(`/learning/lessons/${lesson.id}/complete`, { token, method: 'POST' });
    assert.equal(watched.body.quiz.locked, false);

    if (lessonIndex === 0) {
      for (let attempt = 1; attempt <= quiz.max_attempts; attempt += 1) {
        const failed = await request(`/learning/quizzes/${quiz.id}/attempts`, {
          token,
          method: 'POST',
          body: JSON.stringify({ answers: answerMap(questions, false) }),
          expectedStatus: 201,
        });
        assert.equal(failed.body.attempt.passed, false);
        assert.equal(failed.body.attempt.attempt_number, attempt);
      }

      const locked = await request(`/learning/lessons/${lesson.id}/quiz`, { token });
      assert.equal(locked.body.quiz.lock_reason, 'REWATCH_REQUIRED');
      assert.equal(locked.body.quiz.remaining_attempts, 0);
      await request(`/learning/quizzes/${quiz.id}/attempts`, {
        token,
        method: 'POST',
        body: JSON.stringify({ answers: answerMap(questions, true) }),
        expectedStatus: 409,
      });

      const rewatched = await request(`/learning/lessons/${lesson.id}/complete`, { token, method: 'POST' });
      assert.equal(rewatched.body.quiz.watch_cycle, 2);
      assert.equal(rewatched.body.quiz.remaining_attempts, quiz.max_attempts);
    }

    const passed = await request(`/learning/quizzes/${quiz.id}/attempts`, {
      token,
      method: 'POST',
      body: JSON.stringify({ answers: answerMap(questions, true) }),
      expectedStatus: 201,
    });
    assert.equal(passed.body.attempt.passed, true);
    const isFinalLesson = lessonIndex === lessonRows.length - 1;
    if (isFinalLesson) {
      assert.ok(passed.body.certificate?.id, 'The final passing quiz must issue a certificate');
      assert.equal(await Certificate.count({ where: { user_id: testUser.id, course_id: testCourse.id } }), 1);
      finalCertificate = passed.body.certificate;
    } else {
      assert.equal(passed.body.certificate, null, 'A certificate must not be issued before the final quiz passes');
      assert.equal(await Certificate.count({ where: { user_id: testUser.id, course_id: testCourse.id } }), 0);
    }
    evidence.push({
      lesson: lesson.title,
      score: passed.body.attempt.score,
      passed: passed.body.attempt.passed,
      certificateIssued: Boolean(passed.body.certificate),
    });
  }

  assert.ok(finalCertificate?.id, 'The final passing quiz must issue a certificate');
  const completedCourse = await request(`/learning/courses/${testCourse.id}`, { token });
  assert.equal(completedCourse.body.course.certificate.id, finalCertificate.id);
  assert.ok(completedCourse.body.course.lessons.every((lesson) => lesson.completed_at && lesson.quiz?.passed));

  await request(`/learning/certificates/${finalCertificate.id}/download`, { expectedStatus: 401 });
  await request(`/learning/certificates/${finalCertificate.id}/download`, { token: otherToken, expectedStatus: 404 });
  const certificatePdf = await request(`/learning/certificates/${finalCertificate.id}/download`, { token });
  assert.match(certificatePdf.response.headers.get('content-type') || '', /application\/pdf/);
  assert.equal(certificatePdf.body.subarray(0, 5).toString(), '%PDF-');
  assert.ok(certificatePdf.body.length > 1500);
  assert.equal(await Certificate.count({ where: { user_id: testUser.id, course_id: testCourse.id } }), 1);

  console.log(JSON.stringify({
    ok: true,
    course: testCourse.title,
    lessonsTested: lessonRows.length,
    maxAttemptsTested: lessonRows[0] ? (await Quiz.findOne({ where: { lesson_id: lessonRows[0].id } })).max_attempts : 0,
    evidence,
    certificate: {
      id: finalCertificate.id,
      contentType: certificatePdf.response.headers.get('content-type'),
      bytes: certificatePdf.body.length,
      startsWithPdfHeader: certificatePdf.body.subarray(0, 5).toString(),
    },
  }, null, 2));
};

run()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error(`Cleanup failed: ${cleanupError.stack || cleanupError}`);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  });
