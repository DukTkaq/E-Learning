import api from '../../utils/api';

export const fetchAdminCourses = (params = {}) => api.get('/admin/courses', { params });
export const reviewCourse = (courseId, status, rejectionReason) => api.patch(
  `/admin/courses/${courseId}/status`,
  { status, rejection_reason: rejectionReason },
);
export const hideAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/hide`);
