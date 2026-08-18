import api from '../../utils/api';

export const fetchCart = () => api.get('/cart');
export const addCourseToCart = (courseId) => api.post('/cart/items', { course_id: courseId });
export const removeCourseFromCart = (courseId) => api.delete(`/cart/items/${courseId}`);
export const checkoutCart = (payload) => api.post('/checkout', payload);
