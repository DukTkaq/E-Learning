import api from '../../utils/api';

export const fetchUsers = () => api.get('/admin/users');
export const banUser = (id) => api.put(`/admin/users/${id}/ban`);
export const unbanUser = (id) => api.put(`/admin/users/${id}/unban`);

// Instructor Approval Workflow
export const fetchInstructorRequests = () => api.get('/admin/instructor-requests');
export const approveInstructor = (id) => api.put(`/admin/instructor-requests/${id}/approve`);
export const rejectInstructor = (id) => api.put(`/admin/instructor-requests/${id}/reject`);
