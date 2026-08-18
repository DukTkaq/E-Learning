import api from '../../utils/api';

export const fetchCatalog = (params = {}) => api.get('/courses', { params });
export const fetchCourseDetail = (courseId) => api.get(`/courses/${courseId}`);
export const fetchMyCourses = () => api.get('/courses/mine');
export const fetchCatalogCategories = () => api.get('/categories');
