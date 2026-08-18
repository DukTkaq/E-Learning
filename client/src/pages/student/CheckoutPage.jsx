import { useCallback, useEffect, useState } from 'react';
import { CreditCard, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkoutCart, fetchCart } from '../../features/cart/cartApi';
import CheckoutSuccess from '../../components/checkout/CheckoutSuccess';
import CheckoutSummary from '../../components/checkout/CheckoutSummary';
import PaymentDetailsPanel from '../../components/checkout/PaymentDetailsPanel';

export default function CheckoutPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [form, setForm] = useState({ payment_method: 'MockCard', coupon_code: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
      const response = await checkoutCart(form);
      setResult(response.data.checkout);
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Checkout completed successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed. No payment was recorded.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <CheckoutSuccess result={result} />;
  }

  return (
    <section>
      <div className="mb-6"><div className="mb-2 flex items-center gap-2 text-primary"><CreditCard size={20} /><span className="text-sm font-bold uppercase tracking-wider">UC16 Checkout</span></div><h1 className="text-3xl font-bold text-slate-900">Secure checkout</h1><p className="mt-2 flex items-center gap-2 text-gray-500"><LockKeyhole size={15} /> Enrollment is created only after a successful payment record.</p></div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">Loading checkout...</div> : !cart.items?.length ? <div className="rounded-2xl bg-white p-12 text-center"><p className="text-gray-500">Your cart is empty.</p><Link to="/cart" className="mt-4 inline-flex font-semibold text-primary">Return to cart</Link></div> : (
        <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <PaymentDetailsPanel form={form} onChange={updateForm} />
          <CheckoutSummary cart={cart} submitting={submitting} />
        </form>
      )}
    </section>
  );
}
