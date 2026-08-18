import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addCourseToCart } from '../../features/cart/cartApi';

const STORAGE_KEY = 'pendingCartIntent';

export default function PendingCartIntent() {
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    let user;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    if (!token || user?.role_id !== 3) return;

    let intent;
    try { intent = JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { intent = null; }
    if (intent?.type !== 'ADD_TO_CART' || !intent.courseId) return;
    sessionStorage.removeItem(STORAGE_KEY);
    addCourseToCart(intent.courseId).then(() => {
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Course added to cart.');
    }).catch((error) => toast.error(error.response?.data?.message || 'Could not add this course to your cart.'));
  }, [location.key]);

  return null;
}
