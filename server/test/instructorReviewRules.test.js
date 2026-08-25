const test = require('node:test');
const assert = require('node:assert/strict');
const { parseInstructorReviewFilters } = require('../src/rules/instructorReviewRules');

test('review filters normalize valid values and defaults', () => {
  assert.deepEqual(parseInstructorReviewFilters({}), {
    search: '',
    replyStatus: 'all',
    rating: null,
    sort: 'newest',
  });

  assert.deepEqual(parseInstructorReviewFilters({
    search: '  useful course  ',
    reply_status: 'awaiting',
    rating: '4',
    sort: 'rating_desc',
  }), {
    search: 'useful course',
    replyStatus: 'awaiting',
    rating: 4,
    sort: 'rating_desc',
  });
});

test('review filters reject unsupported values', () => {
  assert.throws(() => parseInstructorReviewFilters({ reply_status: 'pending' }), /Invalid reply status/);
  assert.throws(() => parseInstructorReviewFilters({ rating: '6' }), /integer from 1 to 5/);
  assert.throws(() => parseInstructorReviewFilters({ sort: 'popular' }), /Invalid review sort/);
  assert.throws(() => parseInstructorReviewFilters({ search: 'x'.repeat(101) }), /must not exceed 100/);
});
