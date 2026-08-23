const test = require('node:test');
const assert = require('node:assert/strict');

let mergeLessonSession;
try {
  ({ mergeLessonSession } = require('../src/utils/learningSession'));
} catch {
  mergeLessonSession = undefined;
}

test('video autosave preserves quiz state and the furthest watched position', () => {
  assert.equal(typeof mergeLessonSession, 'function');
  const lessonState = {
    resume_position_seconds: 120,
    furthest_watched_seconds: 180,
    quiz: { quiz_id: 'quiz-1', failed_attempts: 1, passed: false },
  };

  assert.deepEqual(mergeLessonSession(lessonState, {
    video_position_seconds: 150.26,
    furthest_watched_seconds: 150.26,
  }), {
    resume_position_seconds: 150.3,
    furthest_watched_seconds: 180,
    quiz: { quiz_id: 'quiz-1', failed_attempts: 1, passed: false },
  });
  assert.equal(lessonState.resume_position_seconds, 120);
});

test('quiz autosave normalizes valid answers without overwriting video progress', () => {
  assert.equal(typeof mergeLessonSession, 'function');
  const result = mergeLessonSession({
    resume_position_seconds: 305,
    furthest_watched_seconds: 305,
    quiz: { quiz_id: 'quiz-1', watch_cycle: 1, failed_attempts: 0, passed: false },
  }, {
    quiz_answers: { 'question-1': 'b', 'question-2': 'D' },
  }, {
    quizId: 'quiz-1',
    questionIds: ['question-1', 'question-2'],
  });

  assert.deepEqual(result, {
    resume_position_seconds: 305,
    furthest_watched_seconds: 305,
    quiz: {
      quiz_id: 'quiz-1',
      watch_cycle: 1,
      failed_attempts: 0,
      passed: false,
      draft_answers: { 'question-1': 'B', 'question-2': 'D' },
    },
  });
});

test('quiz autosave rejects unknown questions and invalid choices', () => {
  assert.equal(typeof mergeLessonSession, 'function');
  const options = { quizId: 'quiz-1', questionIds: ['question-1'] };

  assert.throws(() => mergeLessonSession({}, {
    quiz_answers: { unknown: 'A' },
  }, options), /unknown question/i);
  assert.throws(() => mergeLessonSession({}, {
    quiz_answers: { 'question-1': 'E' },
  }, options), /A, B, C, or D/i);
});

test('required rewatch rejects playback progress that advances faster than real time', () => {
  const lessonState = {
    resume_position_seconds: 0,
    furthest_watched_seconds: 0,
    playback_saved_at: '2026-08-22T00:00:00.000Z',
  };
  const options = {
    rewatchRequired: true,
    savedAt: '2026-08-22T00:00:03.000Z',
  };

  assert.throws(() => mergeLessonSession(lessonState, {
    video_position_seconds: 100,
    furthest_watched_seconds: 100,
  }, options), /advances too quickly/i);
  assert.throws(() => mergeLessonSession(lessonState, {
    video_position_seconds: 1000,
    furthest_watched_seconds: 0,
  }, options), /advances too quickly/i);

  const valid = mergeLessonSession(lessonState, {
    video_position_seconds: 6,
    furthest_watched_seconds: 6,
  }, options);
  assert.equal(valid.furthest_watched_seconds, 6);
  assert.equal(valid.playback_saved_at, '2026-08-22T00:00:03.000Z');
});

test('required rewatch does not grant a new tolerance allowance on every autosave', () => {
  const lessonState = {
    resume_position_seconds: 0,
    furthest_watched_seconds: 0,
    rewatch_started_at: '2026-08-22T00:00:00.000Z',
    playback_saved_at: '2026-08-22T00:00:00.000Z',
  };
  const options = {
    rewatchRequired: true,
    savedAt: '2026-08-22T00:00:03.000Z',
  };
  const first = mergeLessonSession(lessonState, {
    video_position_seconds: 7,
    furthest_watched_seconds: 7,
  }, options);

  assert.throws(() => mergeLessonSession(first, {
    video_position_seconds: 8,
    furthest_watched_seconds: 8,
  }, options), /advances too quickly/i);
});

test('a skippable lesson permits jumping forward during a required rewatch', () => {
  const result = mergeLessonSession({
    resume_position_seconds: 0,
    furthest_watched_seconds: 0,
  }, {
    video_position_seconds: 100,
    furthest_watched_seconds: 100,
  }, {
    rewatchRequired: true,
    allowSkipping: true,
    savedAt: '2026-08-22T00:00:03.000Z',
  });

  assert.equal(result.resume_position_seconds, 100);
  assert.equal(result.furthest_watched_seconds, 100);
});
