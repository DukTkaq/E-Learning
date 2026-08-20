const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canEditCourse,
  canEnrolledStudentLearn,
  getCourseEditMessage,
} = require('../src/rules/courseStatusRules');

test('only draft and rejected courses can be edited', () => {
  assert.equal(canEditCourse('Draft'), true);
  assert.equal(canEditCourse('Rejected'), true);
  assert.equal(canEditCourse('Pending'), false);
  assert.equal(canEditCourse('Approved'), false);
  assert.equal(canEditCourse('Hidden'), false);
});

test('enrolled students can learn approved and hidden courses', () => {
  assert.equal(canEnrolledStudentLearn('Approved'), true);
  assert.equal(canEnrolledStudentLearn('Hidden'), true);
  assert.equal(canEnrolledStudentLearn('Draft'), false);
  assert.equal(canEnrolledStudentLearn('Pending'), false);
  assert.equal(canEnrolledStudentLearn('Rejected'), false);
});

test('approved course edit errors explain that the course is locked', () => {
  assert.match(getCourseEditMessage('Approved'), /locked/i);
});
