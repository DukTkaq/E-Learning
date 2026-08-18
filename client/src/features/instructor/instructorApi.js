import api from '../../utils/api';

export const fetchRevenue = (params = {}) => api.get('/instructor/revenue', { params });
export const fetchReviews = () => api.get('/instructor/reviews');
export const replyToReview = (reviewId, reply) => api.put(`/instructor/reviews/${reviewId}/reply`, { reply });
