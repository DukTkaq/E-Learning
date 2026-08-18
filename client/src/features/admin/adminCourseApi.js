import api from '../../utils/api';

export const fetchAdminCourses = (params = {}) => api.get('/admin/courses', { params });
export const reviewCourse = (courseId, status) => api.patch(`/admin/courses/${courseId}/status`, { status });
