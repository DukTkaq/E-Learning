import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart, Tag, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CartItemCard from '../../components/cart/CartItemCard';
import { fetchCart, removeCourseFromCart, applyVoucherToCart } from '../../features/cart/cartApi';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const navigate = useNavigate();

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
      // if voucher is applied, re-apply it to update totals
      if (cart.appliedVoucher) {
        applyVoucher(cart.appliedVoucher);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove this course.');
    } finally {
      setRemovingId(null);
    }
  };

  const applyVoucher = async (code) => {
    if (!code.trim()) return;
    setApplyingVoucher(true);
    try {
      const response = await applyVoucherToCart(code);
      setCart(response.data.cart);
      toast.success('Voucher applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid voucher or not applicable.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  return (
    <section>
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Your cart</h1><p className="mt-2 text-gray-500">{cart.item_count || 0} course(s) ready for checkout</p></div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">Loading your cart...</div> : !cart.items?.length ? <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center"><ShoppingCart className="mx-auto text-primary" size={36} /><h2 className="mt-4 text-xl font-bold text-slate-800">Your cart is empty</h2><p className="mt-1 text-gray-500">Add an approved course from the course catalog.</p><Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white">Browse courses</Link></div> : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">{cart.items.map((item) => <CartItemCard key={item.id} item={item} removing={removingId === item.course_id} onRemove={remove} />)}</div>
          
          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-slate-800">Order summary</h2>
            
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2"><Tag size={16} /> Apply Voucher</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={voucherCode} 
                  onChange={e => setVoucherCode(e.target.value.toUpperCase())} 
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm" 
                  placeholder="CODE" 
                />
                <button 
                  onClick={() => applyVoucher(voucherCode)} 
                  disabled={applyingVoucher || !voucherCode} 
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {applyingVoucher ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
            </div>

            <div className="my-5 flex flex-col gap-3 border-y border-gray-100 py-5 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currency.format(Number(cart.subtotal))}</span>
              </div>
              
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({cart.appliedVoucher})</span>
                  <span>-{currency.format(Number(cart.discount))}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-primary">{currency.format(Number(cart.total || cart.subtotal))}</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/checkout', { state: { coupon_code: cart.appliedVoucher || '' } })} 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Proceed to checkout <ArrowRight size={18} />
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
