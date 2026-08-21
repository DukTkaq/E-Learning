import test from 'node:test';
import assert from 'node:assert/strict';

import { getLessonNavigation } from '../src/utils/lessonNavigation.js';

const lessons = [
  { id: 'lesson-2', order_index: 1 },
  { id: 'lesson-1', order_index: 0 },
  { id: 'lesson-3', order_index: 2 },
];

test('completed lesson with a passed quiz navigates to the next ordered lesson', () => {
  assert.equal(typeof getLessonNavigation, 'function');
  assert.deepEqual(getLessonNavigation({
    currentLessonId: 'lesson-1',
    courseLessons: lessons,
    completedAt: '2026-08-21T00:00:00Z',
    quiz: { passed: true },
  }), { type: 'next', lessonId: 'lesson-2', label: 'Next lesson' });
});

test('navigation stays hidden until both the video and quiz are completed', () => {
  assert.equal(typeof getLessonNavigation, 'function');
  assert.equal(getLessonNavigation({
    currentLessonId: 'lesson-1',
    courseLessons: lessons,
    completedAt: null,
    quiz: { passed: true },
  }), null);
  assert.equal(getLessonNavigation({
    currentLessonId: 'lesson-1',
    courseLessons: lessons,
    completedAt: '2026-08-21T00:00:00Z',
    quiz: { passed: false },
  }), null);
});

test('the final completed lesson returns a Finish action', () => {
  assert.equal(typeof getLessonNavigation, 'function');
  assert.deepEqual(getLessonNavigation({
    currentLessonId: 'lesson-3',
    courseLessons: lessons,
    completedAt: '2026-08-21T00:00:00Z',
    quiz: { passed: true },
  }), { type: 'finish', lessonId: null, label: 'Finish' });
});
