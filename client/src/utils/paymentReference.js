export const buildPaymentReference = (payment = {}) => ({
  order: {
    label: 'Order ID',
    value: payment.checkout_ref || payment.id,
  },
  details: payment.provider_transaction_no ? {
    label: 'Chi tiết giao dịch',
    transaction: {
      label: 'Mã giao dịch VNPay',
      value: payment.provider_transaction_no,
    },
  } : null,
});
