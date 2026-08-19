import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLoginHandoff,
  resolvePostLoginDestination,
  sanitizeInternalPath,
} from '../src/utils/authNavigation.js';

test('sanitizeInternalPath accepts local paths and rejects external or protocol-relative redirects', () => {
  assert.equal(sanitizeInternalPath('/courses/abc?tab=reviews'), '/courses/abc?tab=reviews');
  assert.equal(sanitizeInternalPath('//evil.example/path'), '/');
  assert.equal(sanitizeInternalPath('https://evil.example/path'), '/');
  assert.equal(sanitizeInternalPath('javascript:alert(1)'), '/');
});

test('buildLoginHandoff preserves a guest add-to-cart intent', () => {
  assert.deepEqual(buildLoginHandoff('course-123', '/courses/course-123'), {
    loginPath: '/login?returnTo=%2Fcourses%2Fcourse-123',
    intent: {
      type: 'ADD_TO_CART',
      courseId: 'course-123',
      returnTo: '/courses/course-123',
    },
  });
});

test('resolvePostLoginDestination returns Students safely and keeps staff on role homes', () => {
  assert.equal(resolvePostLoginDestination(3, '/courses/course-123'), '/courses/course-123');
  assert.equal(resolvePostLoginDestination(3, 'https://evil.example'), '/');
  assert.equal(resolvePostLoginDestination(2, '/courses/course-123'), '/instructor/courses');
  assert.equal(resolvePostLoginDestination(1, '/courses/course-123'), '/admin/dashboard');
});
