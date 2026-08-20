import test from 'node:test';
import assert from 'node:assert/strict';

import { canEditCourse, getCourseReadOnlyNotice } from '../src/features/courses/courseStatus.js';

test('only draft and rejected courses are editable', () => {
  assert.equal(canEditCourse('Draft'), true);
  assert.equal(canEditCourse('Rejected'), true);
  assert.equal(canEditCourse('Pending'), false);
  assert.equal(canEditCourse('Approved'), false);
  assert.equal(canEditCourse('Hidden'), false);
});

test('approved and hidden courses explain why they are read-only', () => {
  assert.match(getCourseReadOnlyNotice('Approved').title, /locked/i);
  assert.match(getCourseReadOnlyNotice('Hidden').text, /enrolled students/i);
});
