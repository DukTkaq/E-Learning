import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => vite.close());

let LearningLessonItem;
try {
  ({ default: LearningLessonItem } = await vite.ssrLoadModule('/src/components/learning/LearningLessonItem.jsx'));
} catch {
  LearningLessonItem = undefined;
}

const renderItem = (lesson) => renderToStaticMarkup(createElement(
  MemoryRouter,
  null,
  createElement(LearningLessonItem, { courseId: 'course-1', lesson, index: 0 }),
));

test('a prerequisite-locked lesson is not rendered as a link', () => {
  assert.equal(typeof LearningLessonItem, 'function');
  const html = renderItem({
    id: 'lesson-2', title: 'Lesson 2', access_locked: true,
    access_lock_reason: 'PREVIOUS_LESSON_REQUIRED',
    quiz: { passed: false, locked: true, remaining_failed_attempts: 0 },
  });

  assert.doesNotMatch(html, /href=/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /Complete the previous lesson to unlock/);
});

test('an accessible lesson links to its player', () => {
  assert.equal(typeof LearningLessonItem, 'function');
  const html = renderItem({
    id: 'lesson-1', title: 'Lesson 1', access_locked: false,
    completed_at: null, quiz: { passed: false, locked: true, remaining_failed_attempts: 0 },
  });

  assert.match(html, /href="\/learn\/courses\/course-1\/lessons\/lesson-1"/);
  assert.doesNotMatch(html, /Complete the previous lesson to unlock/);
});

test('an accessible lesson reports remaining failed attempts', () => {
  const html = renderItem({
    id: 'lesson-1', title: 'Lesson 1', access_locked: false,
    completed_at: '2026-08-22T00:00:00.000Z',
    quiz: { passed: true, locked: false, remaining_failed_attempts: 2 },
  });

  assert.match(html, /Passed · 2 failed attempts left/);
  assert.doesNotMatch(html, /2 attempts remaining/);
});
