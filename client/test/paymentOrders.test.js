import test from 'node:test';
import assert from 'node:assert/strict';

import { groupPaymentsByOrder } from '../src/utils/paymentOrders.js';

test('groups course payments from the same checkout into one order', () => {
  assert.equal(typeof groupPaymentsByOrder, 'function');
  const orders = groupPaymentsByOrder([
    {
      id: 'payment-1', checkout_ref: 'EL-ORDER-1', amount: '489000.00', payment_method: 'VNPay',
      status: 'Success', paid_at: '2026-08-21T08:51:00.000Z', provider_transaction_no: '15664139',
      Course: { id: 'course-1', title: 'Docker' },
      Coupon: { code: 'SAVE10', discount_percent: 10 },
    },
    {
      id: 'payment-2', checkout_ref: 'EL-ORDER-1', amount: '100000.00', payment_method: 'VNPay',
      status: 'Success', paid_at: '2026-08-21T08:51:00.000Z', provider_transaction_no: '15664139',
      Course: { id: 'course-2', title: 'Kubernetes' }, Coupon: null,
    },
  ]);

  assert.deepEqual(orders, [{
    id: 'EL-ORDER-1', orderId: 'EL-ORDER-1', paymentMethod: 'VNPay', status: 'Success',
    paidAt: '2026-08-21T08:51:00.000Z', transactionNo: '15664139', total: 589000,
    items: [
      { paymentId: 'payment-1', courseId: 'course-1', title: 'Docker', amount: 489000, coupon: { code: 'SAVE10', discountPercent: 10 } },
      { paymentId: 'payment-2', courseId: 'course-2', title: 'Kubernetes', amount: 100000, coupon: null },
    ],
  }]);
});

test('legacy payments without a checkout reference remain separate orders', () => {
  assert.equal(typeof groupPaymentsByOrder, 'function');
  const orders = groupPaymentsByOrder([
    { id: 'payment-1', checkout_ref: null, amount: '100', Course: { id: 'course-1', title: 'Course 1' } },
    { id: 'payment-2', checkout_ref: null, amount: '200', Course: { id: 'course-2', title: 'Course 2' } },
  ]);

  assert.deepEqual(orders.map((order) => order.id), ['payment-1', 'payment-2']);
});
