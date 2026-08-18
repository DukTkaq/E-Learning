import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import CartItemCard from '../../components/cart/CartItemCard';
import { fetchCart, removeCourseFromCart } from '../../features/cart/cartApi';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchCart();
      setCart(response.data.cart);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (courseId) => {
    setRemovingId(courseId);
    try {
      const response = await removeCourseFromCart(courseId);
      setCart(response.data.cart);
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Course removed from cart.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove this course.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6"><div className="mb-2 flex items-center gap-2 text-primary"><ShoppingCart size={20} /><span className="text-sm font-bold uppercase tracking-wider">UC14 Shopping Cart</span></div><h1 className="text-3xl font-bold text-slate-900">Your cart</h1><p className="mt-2 text-gray-500">{cart.item_count || 0} course(s) ready for checkout</p></div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">Loading your cart...</div> : !cart.items?.length ? <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center"><ShoppingCart className="mx-auto text-primary" size={36} /><h2 className="mt-4 text-xl font-bold text-slate-800">Your cart is empty</h2><p className="mt-1 text-gray-500">Add an approved course from the course catalog.</p><Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white">Browse courses</Link></div> : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">{cart.items.map((item) => <CartItemCard key={item.id} item={item} removing={removingId === item.course_id} onRemove={remove} />)}</div>
          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-24"><h2 className="text-lg font-bold text-slate-800">Order summary</h2><div className="my-5 flex justify-between border-b border-gray-100 pb-5 text-gray-600"><span>Subtotal</span><span className="font-bold text-slate-800">{currency.format(Number(cart.subtotal))}</span></div><Link to="/checkout" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">Proceed to checkout <ArrowRight size={18} /></Link></aside>
        </div>
      )}
    </section>
  );
}
