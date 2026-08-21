import { useEffect, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPaymentHistory } from '../../features/learning/learningApi';
import { buildPaymentReference } from '../../utils/paymentReference';
import { groupPaymentsByOrder } from '../../utils/paymentOrders';
import PaymentOrderDetailsModal from '../../components/payments/PaymentOrderDetailsModal';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

function PaymentReference({ order, onView }) {
  const reference = buildPaymentReference({ id: order.id, checkout_ref: order.orderId });
  return <div className="mt-1 text-xs text-gray-500"><p>{reference.order.label}: <span className="break-all">{reference.order.value}</span></p><button type="button" onClick={onView} className="mt-1 font-semibold text-primary hover:underline">View details</button></div>;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
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
  const orders = groupPaymentsByOrder(payments);
  return <section><div className="mb-7"><h1 className="text-3xl font-bold">Payment history</h1><p className="mt-2 text-gray-500">Your successful transactions, newest first.</p></div>
    {loading ? <div className="rounded-2xl bg-white p-14 text-center">Loading payments...</div> : error ? <div className="rounded-2xl border border-error/20 bg-error/5 p-10 text-center text-error">{error}</div> : orders.length ? <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="divide-y divide-gray-100">{orders.map((order) => <div key={order.id} className="grid gap-3 p-5 md:grid-cols-[1.5fr_1fr_1fr] md:items-center"><div><strong>{order.items.length === 1 ? order.items[0].title : `${order.items.length} courses`}</strong>{order.items.length > 1 && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{order.items.map((item) => item.title).join(', ')}</p>}<PaymentReference order={order} onView={() => setSelectedOrder(order)} /></div><div className="text-sm text-gray-600"><p>{order.paymentMethod}</p><p>{date.format(new Date(order.paidAt))}</p></div><div className="md:text-right"><strong className="text-primary">{money.format(order.total)}</strong><p className="text-xs text-success">Successful</p></div></div>)}</div></div> : <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center"><ReceiptText className="mx-auto text-primary" size={40} /><h2 className="mt-3 text-xl font-bold">No successful payments yet</h2></div>}
    {selectedOrder && <PaymentOrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
  </section>;
}
