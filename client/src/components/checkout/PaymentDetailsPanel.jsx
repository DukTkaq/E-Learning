import { CheckCircle2, LoaderCircle } from 'lucide-react';

export default function PaymentDetailsPanel({
  form,
  appliedCouponCode,
  applying,
  onApply,
  onChange,
}) {
  const updateField = (event) => onChange(event.target.name, event.target.value);

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Payment details</h2>
      <div className="mt-5 space-y-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="font-semibold text-slate-800">VNPay Sandbox</p>
          <p className="mt-1 text-sm leading-6 text-gray-500">You will continue on VNPay to choose QR, domestic bank or international card.</p>
        </div>

        <div>
          <label htmlFor="checkout-coupon" className="block text-sm font-semibold text-slate-700">
            Coupon code <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="mt-2 flex gap-2">
            <input id="checkout-coupon" name="coupon_code" value={form.coupon_code} onChange={updateField} maxLength={50} className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="SAVE20" />
            <button type="button" onClick={onApply} disabled={applying || !form.coupon_code.trim()} className="inline-flex min-w-24 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {applying && <LoaderCircle className="animate-spin" size={17} />}
              Apply
            </button>
          </div>
        </div>
        {appliedCouponCode && (
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 size={17} /> Voucher {appliedCouponCode} applied
          </p>
        )}
      </div>
    </article>
  );
}
