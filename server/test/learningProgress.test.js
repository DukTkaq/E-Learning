const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateCourseProgress, getSequentialLessonAccess } = require('../src/utils/learningProgress');

const lessons = [{ id: 'lesson-1' }, { id: 'lesson-2' }];
const quizzes = [
  { id: 'quiz-1', lesson_id: 'lesson-1' },
  { id: 'quiz-2', lesson_id: 'lesson-2' },
];

test('watching a video without passing its quiz does not increase course progress', () => {
  assert.equal(typeof calculateCourseProgress, 'function');
  assert.equal(calculateCourseProgress(lessons, quizzes, {
    lessons: {
      'lesson-1': { completed_at: '2026-08-21T00:00:00Z', quiz: { quiz_id: 'quiz-1', passed: false } },
    },
  }), 0);
});

test('progress increases only for lessons whose video and matching quiz are complete', () => {
  assert.equal(typeof calculateCourseProgress, 'function');
  const learningState = {
    lessons: {
      'lesson-1': { completed_at: '2026-08-21T00:00:00Z', quiz: { quiz_id: 'quiz-1', passed: true } },
      'lesson-2': { completed_at: '2026-08-21T00:00:00Z', quiz: { quiz_id: 'quiz-2', passed: false } },
    },
  };

  assert.equal(calculateCourseProgress(lessons, quizzes, learningState), 50);
  learningState.lessons['lesson-2'].quiz.passed = true;
  assert.equal(calculateCourseProgress(lessons, quizzes, learningState), 100);
});

test('a watched lesson without a quiz is not counted as complete', () => {
  assert.equal(typeof calculateCourseProgress, 'function');
  assert.equal(calculateCourseProgress([{ id: 'lesson-1' }], [], {
    lessons: { 'lesson-1': { completed_at: '2026-08-21T00:00:00Z' } },
  }), 0);
});

test('later lessons stay locked until every previous lesson is complete', () => {
  assert.equal(typeof getSequentialLessonAccess, 'function');
  const orderedLessons = [
    { id: 'lesson-2', order_index: 1 },
    { id: 'lesson-1', order_index: 0 },
    { id: 'lesson-3', order_index: 2 },
  ];
  const orderedQuizzes = [
    { id: 'quiz-1', lesson_id: 'lesson-1' },
    { id: 'quiz-2', lesson_id: 'lesson-2' },
    { id: 'quiz-3', lesson_id: 'lesson-3' },
  ];
  const learningState = {
    lessons: {
      'lesson-1': { completed_at: '2026-08-21', quiz: { quiz_id: 'quiz-1', passed: true } },
      'lesson-2': { completed_at: '2026-08-21', quiz: { quiz_id: 'quiz-2', passed: false } },
    },
  };

  assert.deepEqual(getSequentialLessonAccess(orderedLessons, orderedQuizzes, learningState), {
    'lesson-1': { locked: false, lock_reason: null },
    'lesson-2': { locked: false, lock_reason: null },
    'lesson-3': { locked: true, lock_reason: 'PREVIOUS_LESSON_REQUIRED' },
  });
});

test('only the first lesson is open before learning starts', () => {
  assert.equal(typeof getSequentialLessonAccess, 'function');
  assert.deepEqual(getSequentialLessonAccess(
    [{ id: 'lesson-1', order_index: 0 }, { id: 'lesson-2', order_index: 1 }],
    [{ id: 'quiz-1', lesson_id: 'lesson-1' }, { id: 'quiz-2', lesson_id: 'lesson-2' }],
    { lessons: {} },
  ), {
    'lesson-1': { locked: false, lock_reason: null },
    'lesson-2': { locked: true, lock_reason: 'PREVIOUS_LESSON_REQUIRED' },
  });
});
