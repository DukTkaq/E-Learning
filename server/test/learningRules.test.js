const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateQuizResult,
  getQuizState,
  nextWatchCycle,
  validateReviewInput,
} = require('../src/services/learningRules');

const questions = [
  { id: 'q1', correct_answer: 'A' },
  { id: 'q2', correct_answer: 'B' },
  { id: 'q3', correct_answer: 'C' },
  { id: 'q4', correct_answer: 'D' },
  { id: 'q5', correct_answer: 'A' },
];

test('calculateQuizResult passes exactly four points out of ten', () => {
  const result = calculateQuizResult(questions, {
    q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'B',
  });

  assert.deepEqual(result, {
    correctCount: 2,
    questionCount: 5,
    score: 4,
    passed: true,
    feedback: [
      { question_id: 'q1', submitted_answer: 'A', correct_answer: 'A', correct: true },
      { question_id: 'q2', submitted_answer: 'B', correct_answer: 'B', correct: true },
      { question_id: 'q3', submitted_answer: 'A', correct_answer: 'C', correct: false },
      { question_id: 'q4', submitted_answer: 'A', correct_answer: 'D', correct: false },
      { question_id: 'q5', submitted_answer: 'B', correct_answer: 'A', correct: false },
    ],
  });
});

test('calculateQuizResult rejects incomplete and unknown answers', () => {
  assert.throws(
    () => calculateQuizResult(questions, { q1: 'A' }),
    /answer every question/i,
  );
  assert.throws(
    () => calculateQuizResult(questions, {
      q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A', unknown: 'A',
    }),
    /unknown question/i,
  );
});

test('getQuizState locks an unwatched lesson and exposes three attempts after completion', () => {
  assert.deepEqual(getQuizState({ watchCycle: 0, attempts: [] }), {
    watch_cycle: 0,
    attempts_used: 0,
    remaining_attempts: 0,
    passed: false,
    locked: true,
    lock_reason: 'WATCH_REQUIRED',
  });

  assert.deepEqual(getQuizState({ watchCycle: 1, attempts: [] }), {
    watch_cycle: 1,
    attempts_used: 0,
    remaining_attempts: 3,
    passed: false,
    locked: false,
    lock_reason: null,
  });
});

test('getQuizState locks after three failures and permanently after a pass', () => {
  const failures = [
    { watch_cycle: 2, passed: false },
    { watch_cycle: 2, passed: false },
    { watch_cycle: 2, passed: false },
    { watch_cycle: 1, passed: false },
  ];
  assert.equal(getQuizState({ watchCycle: 2, attempts: failures }).lock_reason, 'REWATCH_REQUIRED');

  const passed = [{ watch_cycle: 2, passed: true }];
  assert.deepEqual(getQuizState({ watchCycle: 2, attempts: passed }), {
    watch_cycle: 2,
    attempts_used: 1,
    remaining_attempts: 0,
    passed: true,
    locked: true,
    lock_reason: 'PASSED',
  });
});

test('nextWatchCycle is idempotent until three failures require a rewatch', () => {
  assert.equal(nextWatchCycle({ watchCycle: 0, attempts: [] }), 1);
  assert.equal(nextWatchCycle({ watchCycle: 1, attempts: [] }), 1);
  assert.equal(nextWatchCycle({ watchCycle: 1, attempts: [
    { watch_cycle: 1, passed: false },
    { watch_cycle: 1, passed: false },
    { watch_cycle: 1, passed: false },
  ] }), 2);
  assert.equal(nextWatchCycle({ watchCycle: 2, attempts: [{ watch_cycle: 2, passed: true }] }), 2);
});

test('validateReviewInput enforces integer stars and a meaningful bounded comment', () => {
  assert.deepEqual(validateReviewInput({ rating: 5, comment: '  Great course!  ' }), {
    rating: 5,
    comment: 'Great course!',
  });
  assert.throws(() => validateReviewInput({ rating: 4.5, comment: 'Good' }), /whole number/i);
  assert.throws(() => validateReviewInput({ rating: 0, comment: 'Bad' }), /between 1 and 5/i);
  assert.throws(() => validateReviewInput({ rating: 4, comment: ' ' }), /comment is required/i);
  assert.throws(() => validateReviewInput({ rating: 4, comment: 'x'.repeat(2001) }), /2,000/i);
});
