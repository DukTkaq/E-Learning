const test = require('node:test');
const assert = require('node:assert/strict');
const fontkit = require('fontkit');
const zlib = require('node:zlib');

const {
  buildCertificatePdf,
  calculateQuizResult,
  certificateFontPaths,
  getQuizState,
  isCourseComplete,
  recordQuizAttempt,
  recordLessonWatched,
  validateReviewInput,
} = require('../src/controllers/learningController').__test;

test('certificate fonts cover ASCII and the complete Vietnamese alphabet', () => {
  const sample = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/-',
    'ĂÂĐÊÔƠƯăâđêôơư',
    'ÀÁẢÃẠàáảãạẰẮẲẴẶằắẳẵặẦẤẨẪẬầấẩẫậ',
    'ÈÉẺẼẸèéẻẽẹỀẾỂỄỆềếểễệÌÍỈĨỊìíỉĩị',
    'ÒÓỎÕỌòóỏõọỒỐỔỖỘồốổỗộỜỚỞỠỢờớởỡợ',
    'ÙÚỦŨỤùúủũụỪỨỬỮỰừứửữựỲÝỶỸỴỳýỷỹỵ',
  ].join('');
  assert.ok(certificateFontPaths, 'Certificate font paths must be exposed for glyph verification');

  for (const [style, fontPath] of Object.entries(certificateFontPaths)) {
    const font = fontkit.openSync(fontPath);
    for (const character of new Set([...sample.replace(/\s/g, '')])) {
      assert.equal(
        font.hasGlyphForCodePoint(character.codePointAt(0)),
        true,
        `${style} certificate font is missing glyph ${character}`,
      );
    }
  }
});

test('buildCertificatePdf creates a PDF while preserving Vietnamese input', async () => {
  const pdf = await buildCertificatePdf({
    studentName: 'Nguyễn Đăng Khoa',
    courseTitle: 'Lập trình ứng dụng',
    issuedDate: new Date('2026-08-20T00:00:00.000Z'),
  });

  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 1500);
});

const certificatePageContent = (pdf) => {
  const source = pdf.toString('latin1');
  const streams = [...source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];
  return streams.flatMap((match) => {
    try {
      const content = zlib.inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1');
      return content.includes('TJ') || content.includes('Tj') ? [content] : [];
    } catch {
      return [];
    }
  });
};

test('certificate ID does not appear in the visible PDF content', async () => {
  const input = {
    studentName: 'Test Student',
    courseTitle: 'Test Course',
    issuedDate: new Date('2026-08-21T00:00:00.000Z'),
  };
  const firstPdf = await buildCertificatePdf({ ...input, certificateId: '11111111-1111-4111-8111-111111111111' });
  const secondPdf = await buildCertificatePdf({ ...input, certificateId: '22222222-2222-4222-8222-222222222222' });

  assert.deepEqual(certificatePageContent(firstPdf), certificatePageContent(secondPdf));
});

const questions = [
  { id: 'q1', correct_answer: 'A' },
  { id: 'q2', correct_answer: 'B' },
  { id: 'q3', correct_answer: 'C' },
  { id: 'q4', correct_answer: 'D' },
  { id: 'q5', correct_answer: 'A' },
];

test('calculateQuizResult uses the quiz passing percentage instead of a hard-coded score', () => {
  const answers = { q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'B' };

  assert.equal(calculateQuizResult(questions, answers, 40).passed, true);
  assert.equal(calculateQuizResult(questions, answers, 60).passed, false);
  assert.equal(calculateQuizResult(questions, answers, 40).score, 4);
});

test('calculateQuizResult rejects incomplete and unknown answers', () => {
  assert.throws(
    () => calculateQuizResult(questions, { q1: 'A' }, 40),
    /answer every question/i,
  );
  assert.throws(
    () => calculateQuizResult(questions, {
      q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A', unknown: 'A',
    }, 40),
    /unknown question/i,
  );
});

test('getQuizState honors each quiz max_attempts value', () => {
  const quiz = { id: 'quiz-1', max_attempts: 2 };
  const lessonState = {
    watch_cycle: 1,
    quiz: { quiz_id: 'quiz-1', watch_cycle: 1, attempts_used: 2, passed: false },
  };

  assert.deepEqual(getQuizState({ lessonState, quiz }), {
    watch_cycle: 1,
    attempts_used: 2,
    remaining_attempts: 0,
    passed: false,
    locked: true,
    lock_reason: 'REWATCH_REQUIRED',
  });
});

test('recordLessonWatched starts learning once and resets attempts only after the limit', () => {
  const quiz = { id: 'quiz-1', max_attempts: 3 };
  const firstWatch = recordLessonWatched({}, quiz, '2026-08-20T08:00:00.000Z');
  const repeatWatch = recordLessonWatched({
    ...firstWatch,
    quiz: { quiz_id: 'quiz-1', watch_cycle: 1, attempts_used: 2, passed: false },
  }, quiz, '2026-08-20T09:00:00.000Z');
  const rewatchAfterLimit = recordLessonWatched({
    ...firstWatch,
    quiz: { quiz_id: 'quiz-1', watch_cycle: 1, attempts_used: 3, passed: false },
  }, quiz, '2026-08-20T10:00:00.000Z');

  assert.equal(firstWatch.watch_cycle, 1);
  assert.equal(repeatWatch.watch_cycle, 1);
  assert.equal(repeatWatch.quiz.attempts_used, 2);
  assert.equal(rewatchAfterLimit.watch_cycle, 2);
  assert.equal(rewatchAfterLimit.quiz.attempts_used, 0);
});

test('recordQuizAttempt increments the current cycle and preserves a passing result', () => {
  const quiz = { id: 'quiz-1', max_attempts: 3 };
  const lessonState = { watch_cycle: 2 };

  const failed = recordQuizAttempt(lessonState, quiz, { score: 3, percentage: 30, passed: false }, '2026-08-20T11:00:00.000Z');
  const passed = recordQuizAttempt(failed, quiz, { score: 6, percentage: 60, passed: true }, '2026-08-20T12:00:00.000Z');

  assert.equal(failed.quiz.attempts_used, 1);
  assert.equal(passed.quiz.attempts_used, 2);
  assert.equal(passed.quiz.passed, true);
  assert.equal(passed.quiz.last_score, 6);
});

test('isCourseComplete requires every lesson watched and its quiz passed', () => {
  const lessons = [{ id: 'lesson-1' }, { id: 'lesson-2' }];
  const quizzes = [
    { id: 'quiz-1', lesson_id: 'lesson-1' },
    { id: 'quiz-2', lesson_id: 'lesson-2' },
  ];
  const completeState = {
    lessons: {
      'lesson-1': { completed_at: '2026-08-20', quiz: { quiz_id: 'quiz-1', passed: true } },
      'lesson-2': { completed_at: '2026-08-20', quiz: { quiz_id: 'quiz-2', passed: true } },
    },
  };

  assert.equal(isCourseComplete(lessons, quizzes, completeState), true);
  assert.equal(isCourseComplete(lessons, quizzes.slice(0, 1), completeState), false);
  assert.equal(isCourseComplete(lessons, quizzes, {
    lessons: { ...completeState.lessons, 'lesson-1': { completed_at: '2026-08-20' } },
  }), false);
  assert.equal(isCourseComplete(lessons, quizzes, {
    lessons: { 'lesson-1': completeState.lessons['lesson-1'] },
  }), false);
});

test('validateReviewInput enforces integer stars and a meaningful bounded comment', () => {
  assert.deepEqual(validateReviewInput({ rating: 5, comment: '  Great course!  ' }), {
    rating: 5,
    comment: 'Great course!',
  });
  assert.throws(() => validateReviewInput({ rating: 4.5, comment: 'Good' }), /whole number/i);
  assert.throws(() => validateReviewInput({ rating: 0, comment: 'Bad' }), /between 1 and 5/i);
  assert.throws(() => validateReviewInput({ rating: 4, comment: ' ' }), /comment is required/i);
});
