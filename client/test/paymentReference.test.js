import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPaymentReference } from '../src/utils/paymentReference.js';

test('keeps the order reference primary and moves the VNPay transaction into details', () => {
  assert.equal(typeof buildPaymentReference, 'function');
  assert.deepEqual(buildPaymentReference({
    id: 'payment-1',
    checkout_ref: 'EL20260821ABC',
    provider_transaction_no: '15664139',
  }), {
    order: { label: 'Order ID', value: 'EL20260821ABC' },
    details: {
      label: 'Chi tiết giao dịch',
      transaction: { label: 'Mã giao dịch VNPay', value: '15664139' },
    },
  });
});

test('falls back to payment ID and omits empty transaction details', () => {
  assert.equal(typeof buildPaymentReference, 'function');
  assert.deepEqual(buildPaymentReference({
    id: 'payment-2',
    checkout_ref: null,
    provider_transaction_no: null,
  }), {
    order: { label: 'Order ID', value: 'payment-2' },
    details: null,
  });
});
