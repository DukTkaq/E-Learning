import test from 'node:test';
import assert from 'node:assert/strict';

let getQuizStatusLabel;
let getQuizLockMessage;
try {
  ({ getQuizStatusLabel, getQuizLockMessage } = await import('../src/utils/quizPresentation.js'));
} catch {
  getQuizStatusLabel = undefined;
  getQuizLockMessage = undefined;
}

test('passed quizzes advertise retakes while failed attempts remain', () => {
  assert.equal(typeof getQuizStatusLabel, 'function');
  assert.equal(getQuizStatusLabel({
    passed: true,
    locked: false,
    remaining_failed_attempts: 2,
  }), 'Passed · 2 failed attempts left');
});

test('unpassed quizzes show the remaining failed-attempt allowance', () => {
  assert.equal(getQuizStatusLabel({
    passed: false,
    locked: false,
    remaining_failed_attempts: 3,
  }), '3 failed attempts left');
});

test('a passed quiz that reaches the failure limit keeps its achievement visible', () => {
  const quiz = {
    passed: true,
    locked: true,
    lock_reason: 'REWATCH_REQUIRED',
    max_attempts: 3,
    best_score: 9,
  };

  assert.equal(getQuizStatusLabel(quiz), 'Passed · Rewatch required');
  assert.equal(
    getQuizLockMessage(quiz),
    'Best score: 9/10. You failed 3 times. Watch this video to the end again to retry the quiz.',
  );
});

test('an unwatched lesson explains how to unlock its quiz', () => {
  assert.equal(getQuizStatusLabel({ lock_reason: 'WATCH_REQUIRED', locked: true }), 'Watch lesson first');
  assert.equal(
    getQuizLockMessage({ lock_reason: 'WATCH_REQUIRED', locked: true }),
    'Watch this video to the end to unlock the quiz.',
  );
});
