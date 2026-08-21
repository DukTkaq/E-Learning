const test = require('node:test');
const assert = require('node:assert/strict');
const { getCourseReviewUpdate } = require('../src/rules/courseReviewRules');

test('rejecting a course requires and trims a reason', () => {
  assert.throws(
    () => getCourseReviewUpdate({ status: 'Rejected', rejection_reason: '   ' }),
    /rejection reason is required/i,
  );

  assert.deepEqual(
    getCourseReviewUpdate({ status: 'Rejected', rejection_reason: '  Improve lesson audio.  ' }),
    { status: 'Rejected', rejection_reason: 'Improve lesson audio.' },
  );
});

test('approving a course clears an earlier rejection reason', () => {
  assert.deepEqual(
    getCourseReviewUpdate({ status: 'Approved', rejection_reason: 'Old reason' }),
    { status: 'Approved', rejection_reason: null },
  );
});

test('course reviews reject unsupported statuses and oversized reasons', () => {
  assert.throws(() => getCourseReviewUpdate({ status: 'Hidden' }), /approved or rejected/i);
  assert.throws(
    () => getCourseReviewUpdate({ status: 'Rejected', rejection_reason: 'x'.repeat(1001) }),
    /must not exceed 1000 characters/i,
  );
});
