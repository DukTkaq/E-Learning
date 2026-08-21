import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => vite.close());

let PaymentOrderDetailsModal;
try {
  ({ default: PaymentOrderDetailsModal } = await vite.ssrLoadModule('/src/components/payments/PaymentOrderDetailsModal.jsx'));
} catch {
  PaymentOrderDetailsModal = undefined;
}

test('order details modal presents courses, voucher, total and payment references', () => {
  assert.equal(typeof PaymentOrderDetailsModal, 'function');
  const html = renderToStaticMarkup(createElement(PaymentOrderDetailsModal, {
    order: {
      orderId: 'EL-ORDER-1', paymentMethod: 'VNPay', status: 'Success',
      paidAt: '2026-08-21T08:51:00.000Z', transactionNo: '15664139', total: 589000,
      items: [
        { paymentId: 'payment-1', title: 'Docker', amount: 489000, coupon: { code: 'SAVE10', discountPercent: 10 } },
        { paymentId: 'payment-2', title: 'Kubernetes', amount: 100000, coupon: null },
      ],
    },
    onClose: () => {},
  }));

  assert.match(html, /role="dialog"/);
  assert.match(html, /Order details/);
  assert.match(html, /EL-ORDER-1/);
  assert.match(html, /Docker/);
  assert.match(html, /Kubernetes/);
  assert.match(html, /SAVE10/);
  assert.match(html, /10% off/);
  assert.match(html, /589\.000/);
  assert.match(html, /VNPay transaction ID/);
  assert.match(html, /15664139/);
});
