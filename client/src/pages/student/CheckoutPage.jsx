import { useCallback, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createVnpayPayment, fetchCart } from '../../features/cart/cartApi';
import CheckoutSummary from '../../components/checkout/CheckoutSummary';
import PaymentDetailsPanel from '../../components/checkout/PaymentDetailsPanel';

export default function CheckoutPage() {
  const location = useLocation();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [form, setForm] = useState({ coupon_code: location.state?.coupon_code || '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetchCart();
      setCart(response.data.cart);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load checkout.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await createVnpayPayment(form);
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
          <PaymentDetailsPanel form={form} onChange={updateForm} />
          <CheckoutSummary cart={cart} submitting={submitting} />
        </form>
      )}
    </section>
  );
}
