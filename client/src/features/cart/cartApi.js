import api from '../../utils/api';

export const fetchCart = () => api.get('/cart');
export const addCourseToCart = (courseId) => api.post('/cart/items', { course_id: courseId });
export const removeCourseFromCart = (courseId) => api.delete(`/cart/items/${courseId}`);
export const applyVoucherToCart = (code) => api.post('/cart/voucher', { code });
export const createVnpayPayment = (payload) => api.post('/checkout/vnpay', payload);
export const fetchVnpayPaymentStatus = (checkoutRef) => api.get(`/checkout/vnpay/${checkoutRef}/status`);
