import api from '../../utils/api';

export const fetchInstructorCourses = (params = {}) => api.get('/instructor/courses', { params });
export const fetchInstructorCourse = (courseId) => api.get(`/instructor/courses/${courseId}`);
export const fetchCategories = () => api.get('/categories');

const toCourseFormData = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'thumbnailFile' && value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  if (payload.thumbnailFile) formData.append('thumbnail', payload.thumbnailFile);
  return formData;
};

export const createCourse = (payload) => api.post('/instructor/courses', toCourseFormData(payload));
export const updateCourse = (courseId, payload) => api.put(`/instructor/courses/${courseId}`, toCourseFormData(payload));
export const submitCourseForApproval = (courseId) => api.post(`/instructor/courses/${courseId}/submit`);
export const hideCourse = (courseId) => api.patch(`/instructor/courses/${courseId}/hide`);
