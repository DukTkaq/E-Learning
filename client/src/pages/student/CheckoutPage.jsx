import { useCallback, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  applyVoucherToCart,
  createVnpayPayment,
  fetchCart,
} from '../../features/cart/cartApi';
import CheckoutSummary from '../../components/checkout/CheckoutSummary';
import PaymentDetailsPanel from '../../components/checkout/PaymentDetailsPanel';

const normalizeCouponCode = (value) => String(value || '').trim().toUpperCase();

const withoutVoucher = (cart) => ({
  ...cart,
  discount: 0,
  total: Number(cart.subtotal || 0),
  appliedVoucher: null,
});

export default function CheckoutPage() {
  const location = useLocation();
  const initialCouponCode = normalizeCouponCode(location.state?.coupon_code);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [form, setForm] = useState({ coupon_code: initialCouponCode });
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetchCart();
      const baseCart = response.data.cart;
      setCart(baseCart);

      if (initialCouponCode) {
        try {
          const voucherResponse = await applyVoucherToCart(initialCouponCode);
          setCart(voucherResponse.data.cart);
          setAppliedCouponCode(initialCouponCode);
        } catch (error) {
          setCart(withoutVoucher(baseCart));
          toast.error(error.response?.data?.message || 'Could not apply this voucher.');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load checkout.');
    } finally {
      setLoading(false);
    }
  }, [initialCouponCode]);

  useEffect(() => { load(); }, [load]);

  const updateForm = (name, value) => {
    const nextValue = name === 'coupon_code' ? value.toUpperCase() : value;
    setForm((current) => ({ ...current, [name]: nextValue }));

    if (name === 'coupon_code' && normalizeCouponCode(nextValue) !== appliedCouponCode) {
      setAppliedCouponCode('');
      setCart((current) => withoutVoucher(current));
    }
  };

  const applyVoucher = async () => {
    const couponCode = normalizeCouponCode(form.coupon_code);
    if (!couponCode) {
      setAppliedCouponCode('');
      setCart((current) => withoutVoucher(current));
      return;
    }

    setApplyingVoucher(true);
    try {
      const response = await applyVoucherToCart(couponCode);
      setCart(response.data.cart);
      setForm({ coupon_code: response.data.cart.appliedVoucher || couponCode });
      setAppliedCouponCode(couponCode);
      toast.success('Voucher applied successfully.');
    } catch (error) {
      setAppliedCouponCode('');
      setCart((current) => withoutVoucher(current));
      toast.error(error.response?.data?.message || 'Invalid or unavailable voucher.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const couponCode = normalizeCouponCode(form.coupon_code);
    if (couponCode && couponCode !== appliedCouponCode) {
      toast.error('Apply the voucher before continuing to VNPay.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createVnpayPayment({ coupon_code: appliedCouponCode });
      window.location.assign(response.data.payment_url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start VNPay checkout.');
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Secure checkout</h1><p className="mt-2 flex items-center gap-2 text-gray-500"><LockKeyhole size={15} /> Enrollment is created only after VNPay confirms the payment.</p></div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">Loading checkout...</div> : !cart.items?.length ? <div className="rounded-2xl bg-white p-12 text-center"><p className="text-gray-500">Your cart is empty.</p><Link to="/cart" className="mt-4 inline-flex font-semibold text-primary">Return to cart</Link></div> : (
        <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <PaymentDetailsPanel
            form={form}
            appliedCouponCode={appliedCouponCode}
            applying={applyingVoucher}
            onApply={applyVoucher}
            onChange={updateForm}
          />
          <CheckoutSummary
            cart={cart}
            couponReady={!normalizeCouponCode(form.coupon_code) || Boolean(appliedCouponCode)}
            submitting={submitting}
          />
        </form>
      )}
    </section>
  );
}
