const assert = require('node:assert/strict');
const test = require('node:test');
const { Op } = require('sequelize');
const { __test } = require('../src/controllers/voucherController');

test('voucher filters keep results scoped to the current instructor', () => {
  const where = __test.buildVoucherWhere('instructor-id', {
    scope: 'specific_course',
    discount: 'medium',
  });

  assert.equal(where.instructor_id, 'instructor-id');
  assert.equal(where.course_id[Op.not], null);
  assert.deepEqual(where.discount_percent[Op.between], [21, 50]);
});

test('voucher filters reject unsupported values', () => {
  assert.throws(
    () => __test.buildVoucherWhere('instructor-id', { scope: 'another_instructor' }),
    /Invalid voucher scope filter/,
  );
  assert.throws(
    () => __test.buildVoucherWhere('instructor-id', { discount: 'free' }),
    /Invalid discount filter/,
  );
});
