import test from 'node:test';
import assert from 'node:assert/strict';

let getLessonPlaybackSession;
let getQuizDraft;
let mergeQuizSubmissionState;
let mergeQuizAnswerDraft;
let shouldAutosavePosition;
try {
  ({
    getLessonPlaybackSession,
    getQuizDraft,
    mergeQuizSubmissionState,
    mergeQuizAnswerDraft,
    shouldAutosavePosition,
  } = await import('../src/utils/learningSession.js'));
} catch {
  getLessonPlaybackSession = undefined;
  getQuizDraft = undefined;
  mergeQuizSubmissionState = undefined;
  mergeQuizAnswerDraft = undefined;
  shouldAutosavePosition = undefined;
}

test('lesson playback restores the saved position and furthest watched point', () => {
  assert.equal(typeof getLessonPlaybackSession, 'function');
  assert.deepEqual(getLessonPlaybackSession({
    learning_state: {
      resume_position_seconds: 302.5,
      furthest_watched_seconds: 325,
    },
  }), { resumePosition: 302.5, furthestWatched: 325 });
});

test('video autosave waits three seconds unless a lifecycle event forces a save', () => {
  assert.equal(typeof shouldAutosavePosition, 'function');
  assert.equal(shouldAutosavePosition({ nowMs: 2999, lastSavedAtMs: 0 }), false);
  assert.equal(shouldAutosavePosition({ nowMs: 3000, lastSavedAtMs: 0 }), true);
  assert.equal(shouldAutosavePosition({ nowMs: 100, lastSavedAtMs: 99, force: true }), true);
});

test('selecting a quiz choice preserves answers already selected', () => {
  assert.equal(typeof mergeQuizAnswerDraft, 'function');
  const current = { q1: 'A' };
  assert.deepEqual(mergeQuizAnswerDraft(current, 'q2', 'C'), { q1: 'A', q2: 'C' });
  assert.deepEqual(current, { q1: 'A' });
});

test('quiz draft restoration returns saved answers and ignores malformed data', () => {
  assert.equal(typeof getQuizDraft, 'function');
  assert.deepEqual(getQuizDraft({ draft_answers: { q1: 'A', q2: 'C' } }), { q1: 'A', q2: 'C' });
  assert.deepEqual(getQuizDraft({ draft_answers: [] }), {});
  assert.deepEqual(getQuizDraft(null), {});
});

test('the final failed submission resets local playback before a required rewatch', () => {
  assert.equal(typeof mergeQuizSubmissionState, 'function');
  const lesson = {
    id: 'lesson-1',
    learning_state: {
      completed_at: '2026-08-20T08:00:00.000Z',
      resume_position_seconds: 180,
      furthest_watched_seconds: 240,
      quiz: { passed: true, failed_attempts: 2 },
    },
  };
  const quizState = {
    passed: true,
    failed_attempts: 3,
    remaining_failed_attempts: 0,
    lock_reason: 'REWATCH_REQUIRED',
    locked: true,
  };

  const result = mergeQuizSubmissionState(lesson, quizState);

  assert.equal(result.learning_state.resume_position_seconds, 0);
  assert.equal(result.learning_state.furthest_watched_seconds, 0);
  assert.equal(result.learning_state.quiz.passed, true);
  assert.equal(result.learning_state.quiz.lock_reason, 'REWATCH_REQUIRED');
  assert.equal(lesson.learning_state.resume_position_seconds, 180);
});
