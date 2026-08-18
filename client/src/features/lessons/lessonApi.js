import api from '../../utils/api';

export const fetchLessons = (courseId) => api.get(`/instructor/courses/${courseId}/lessons`);
export const createLesson = (courseId, formData) => api.post(`/instructor/courses/${courseId}/lessons`, formData);
export const updateLesson = (courseId, lessonId, formData) => api.put(`/instructor/courses/${courseId}/lessons/${lessonId}`, formData);
export const deleteLesson = (courseId, lessonId) => api.delete(`/instructor/courses/${courseId}/lessons/${lessonId}`);
export const moveLessonUp = (courseId, lessonId) => api.patch(`/instructor/courses/${courseId}/lessons/${lessonId}/move-up`);
export const moveLessonDown = (courseId, lessonId) => api.patch(`/instructor/courses/${courseId}/lessons/${lessonId}/move-down`);
