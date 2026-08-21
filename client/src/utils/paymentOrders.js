const amountNumber = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const groupPaymentsByOrder = (payments = []) => {
  const orders = new Map();

  payments.forEach((payment) => {
    const orderId = payment.checkout_ref || payment.id;
    if (!orders.has(orderId)) {
      orders.set(orderId, {
        id: orderId,
        orderId,
        paymentMethod: payment.payment_method,
        status: payment.status,
        paidAt: payment.paid_at || payment.created_at || null,
        transactionNo: payment.provider_transaction_no || null,
        total: 0,
        items: [],
      });
    }

    const order = orders.get(orderId);
    const amount = amountNumber(payment.amount);
    order.total += amount;
    order.items.push({
      paymentId: payment.id,
      courseId: payment.Course?.id || payment.course_id,
      title: payment.Course?.title || 'Course unavailable',
      amount,
      coupon: payment.Coupon ? {
        code: payment.Coupon.code,
        discountPercent: payment.Coupon.discount_percent,
      } : null,
    });
  });

  return [...orders.values()];
};
