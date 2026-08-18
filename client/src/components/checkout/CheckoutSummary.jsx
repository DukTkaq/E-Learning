import { LoaderCircle } from 'lucide-react';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CheckoutSummary({ cart, submitting }) {
  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Order ({cart.items.length})</h2>
      <div className="my-5 max-h-56 space-y-3 overflow-y-auto border-y border-gray-100 py-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <span className="line-clamp-2 text-gray-600">{item.Course?.title}</span>
            <span className="whitespace-nowrap font-semibold">{currency.format(Number(item.Course?.price || 0))}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-lg font-bold text-slate-900">
        <span>Subtotal</span><span>{currency.format(Number(cart.subtotal))}</span>
      </div>
      <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60">
        {submitting && <LoaderCircle className="animate-spin" size={18} />} Continue to VNPay
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">Sandbox environment — use VNPay test credentials only.</p>
    </aside>
  );
}
