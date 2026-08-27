import { LoaderCircle } from 'lucide-react';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CheckoutSummary({ cart, couponReady, submitting }) {
  const subtotal = Number(cart.subtotal || 0);
  const discount = Number(cart.discount || 0);
  const total = Number(cart.total ?? subtotal);

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
      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span><span>{currency.format(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-medium text-success">
            <span>Voucher ({cart.appliedVoucher})</span>
            <span>-{currency.format(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-slate-900">
          <span>Total</span><span className="text-primary">{currency.format(total)}</span>
        </div>
      </div>
      {!couponReady && <p className="mt-3 text-sm font-medium text-amber-600">Apply the voucher to update the total before continuing.</p>}
      <button type="submit" disabled={submitting || !couponReady} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting && <LoaderCircle className="animate-spin" size={18} />} Continue to VNPay
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">Sandbox environment — use VNPay test credentials only.</p>
    </aside>
  );
}
