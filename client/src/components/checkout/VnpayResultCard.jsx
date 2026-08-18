import { CheckCircle2, Clock3, LoaderCircle, ShieldAlert, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const RESULT_COPY = {
  Success: {
    icon: CheckCircle2,
    iconClass: 'text-success',
    title: 'Payment successful',
    description: 'VNPay confirmed your payment. Your courses are ready.',
  },
  Failed: {
    icon: XCircle,
    iconClass: 'text-red-500',
    title: 'Payment failed',
    description: 'VNPay did not complete this payment. Your cart has been kept.',
  },
  Expired: {
    icon: Clock3,
    iconClass: 'text-amber-500',
    title: 'Payment expired',
    description: 'This VNPay session expired. Return to checkout to try again.',
  },
  Invalid: {
    icon: ShieldAlert,
    iconClass: 'text-red-500',
    title: 'Invalid payment response',
    description: 'The VNPay return signature could not be verified.',
  },
};

export default function VnpayResultCard({ status, checkout, checking }) {
  if (status === 'Pending' && checking) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-primary/20 bg-white p-10 text-center shadow-xl">
        <LoaderCircle className="mx-auto animate-spin text-primary" size={60} />
        <h1 className="mt-5 text-3xl font-bold text-slate-900">Confirming payment</h1>
        <p className="mt-2 text-gray-500">Waiting for VNPay's secure server confirmation. Please keep this page open.</p>
      </section>
    );
  }

  if (status === 'Pending') {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-xl">
        <Clock3 className="mx-auto text-amber-500" size={60} />
        <h1 className="mt-5 text-3xl font-bold text-slate-900">Confirmation is taking longer</h1>
        <p className="mt-2 text-gray-500">VNPay has not sent the server confirmation yet. No enrollment has been created and your cart is still safe.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-8 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white">Check again</button>
      </section>
    );
  }

  const copy = RESULT_COPY[status] || RESULT_COPY.Failed;
  const Icon = copy.icon;

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl">
      <Icon className={`mx-auto ${copy.iconClass}`} size={64} />
      <h1 className="mt-5 text-3xl font-bold text-slate-900">{copy.title}</h1>
      <p className="mt-2 text-gray-500">{copy.description}</p>
      {checkout && <p className="mt-6 text-2xl font-bold text-primary">{currency.format(Number(checkout.total))}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status === 'Success' && <Link to="/my-courses" className="rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white">Go to my courses</Link>}
        {status !== 'Success' && <Link to="/checkout" className="rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white">Return to checkout</Link>}
        <Link to="/cart" className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-slate-600">View cart</Link>
      </div>
    </section>
  );
}
