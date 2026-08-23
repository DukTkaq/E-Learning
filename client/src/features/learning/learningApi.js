import api from '../../utils/api';

export const fetchLearningCourse = (courseId) => api.get(`/learning/courses/${courseId}`);
export const fetchLesson = (lessonId) => api.get(`/learning/lessons/${lessonId}`);
export const saveLearningSession = (lessonId, payload) => api.patch(`/learning/lessons/${lessonId}/session`, payload);
export const completeLesson = (lessonId) => api.post(`/learning/lessons/${lessonId}/complete`);
export const fetchLessonQuiz = (lessonId) => api.get(`/learning/lessons/${lessonId}/quiz`);
export const submitQuizAttempt = (quizId, answers) => api.post(`/learning/quizzes/${quizId}/attempts`, { answers });
export const downloadCertificate = (certificateId) => api.get(`/learning/certificates/${certificateId}/download`, { responseType: 'blob' });
export const createCourseReview = (courseId, payload) => api.post(`/courses/${courseId}/reviews`, payload);
export const fetchPaymentHistory = () => api.get('/payments');
