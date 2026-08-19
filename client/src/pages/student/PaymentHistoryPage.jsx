import { useEffect, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPaymentHistory } from '../../features/learning/learningApi';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchPaymentHistory()
      .then((response) => setPayments(response.data.payments || []))
      .catch((requestError) => {
        const message = requestError.response?.data?.message || 'Could not load payment history.';
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);
  return <section><div className="mb-7"><h1 className="text-3xl font-bold">Payment history</h1><p className="mt-2 text-gray-500">Your successful transactions, newest first.</p></div>
    {loading ? <div className="rounded-2xl bg-white p-14 text-center">Loading payments...</div> : error ? <div className="rounded-2xl border border-error/20 bg-error/5 p-10 text-center text-error">{error}</div> : payments.length ? <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="divide-y divide-gray-100">{payments.map((payment) => <div key={payment.id} className="grid gap-3 p-5 md:grid-cols-[1.5fr_1fr_1fr] md:items-center"><div><strong>{payment.Course?.title}</strong><p className="mt-1 text-xs text-gray-500">Checkout: {payment.checkout_ref || payment.id}</p>{payment.provider_transaction_no && <p className="text-xs text-gray-500">Transaction: {payment.provider_transaction_no}</p>}</div><div className="text-sm text-gray-600"><p>{payment.payment_method}</p><p>{date.format(new Date(payment.paid_at || payment.created_at))}</p></div><div className="md:text-right"><strong className="text-primary">{money.format(Number(payment.amount))}</strong><p className="text-xs text-success">Successful</p></div></div>)}</div></div> : <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center"><ReceiptText className="mx-auto text-primary" size={40} /><h2 className="mt-3 text-xl font-bold">No successful payments yet</h2></div>}
  </section>;
}
