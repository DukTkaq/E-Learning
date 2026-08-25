import api from '../../utils/api';

export const fetchRevenue = (params = {}) => api.get('/instructor/revenue', { params });
export const fetchCourseReviews = (courseId, params = {}) => api.get(`/instructor/courses/${courseId}/reviews`, { params });
export const replyToReview = (reviewId, reply) => api.put(`/instructor/reviews/${reviewId}/reply`, { reply });
