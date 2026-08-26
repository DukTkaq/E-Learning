import api from '../../utils/api';

export const fetchUsers = (params = {}) => api.get('/admin/users', { params });
export const banUser = (id) => api.put(`/admin/users/${id}/ban`);
export const unbanUser = (id) => api.put(`/admin/users/${id}/unban`);

// Instructor Approval Workflow
export const fetchInstructorRequests = (params = {}) => api.get('/admin/instructor-requests', { params });
export const fetchInstructorRequestById = (id) => api.get(`/admin/instructor-requests/${id}`);
export const approveInstructor = (id) => api.put(`/admin/instructor-requests/${id}/approve`);
export const rejectInstructor = (id) => api.put(`/admin/instructor-requests/${id}/reject`);
