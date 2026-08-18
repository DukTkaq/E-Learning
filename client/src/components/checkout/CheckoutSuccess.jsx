import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CheckoutSuccess({ result }) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-success/20 bg-white p-10 text-center shadow-xl">
      <CheckCircle2 className="mx-auto text-success" size={64} />
      <h1 className="mt-5 text-3xl font-bold text-slate-900">Payment successful</h1>
      <p className="mt-2 text-gray-500">You are now enrolled in {result.items.length} course(s).</p>
      <p className="mt-6 text-2xl font-bold text-primary">{currency.format(Number(result.total))}</p>
      <Link to="/my-courses" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white">Go to my courses</Link>
    </section>
  );
}
