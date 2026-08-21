const test = require('node:test');
const assert = require('node:assert/strict');

const paymentController = require('../src/controllers/paymentController');

test('payment history query includes course and voucher details', () => {
  assert.equal(typeof paymentController.__test?.buildHistoryQuery, 'function');
  const query = paymentController.__test.buildHistoryQuery('student-1');

  assert.deepEqual(query.where, { user_id: 'student-1', status: 'Success' });
  assert.deepEqual(query.include.map(({ model, attributes }) => ({
    model: model.name,
    attributes,
  })), [
    { model: 'Course', attributes: ['id', 'title', 'thumbnail'] },
    { model: 'Coupon', attributes: ['id', 'code', 'discount_percent'] },
  ]);
});
