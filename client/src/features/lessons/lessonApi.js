import api from '../../utils/api';

const quizBase = (courseId, lessonId) => `/instructor/courses/${courseId}/lessons/${lessonId}/quiz`;

export const fetchLessons = (courseId) => api.get(`/instructor/courses/${courseId}/lessons`);
export const createLesson = (courseId, formData) => api.post(`/instructor/courses/${courseId}/lessons`, formData);
export const updateLesson = (courseId, lessonId, formData) => api.put(`/instructor/courses/${courseId}/lessons/${lessonId}`, formData);
export const deleteLesson = (courseId, lessonId) => api.delete(`/instructor/courses/${courseId}/lessons/${lessonId}`);
export const moveLessonUp = (courseId, lessonId) => api.patch(`/instructor/courses/${courseId}/lessons/${lessonId}/move-up`);
export const moveLessonDown = (courseId, lessonId) => api.patch(`/instructor/courses/${courseId}/lessons/${lessonId}/move-down`);

export const fetchQuiz = (courseId, lessonId) => api.get(quizBase(courseId, lessonId));
export const createQuiz = (courseId, lessonId, data) => api.post(quizBase(courseId, lessonId), data);
export const updateQuiz = (courseId, lessonId, data) => api.put(quizBase(courseId, lessonId), data);
export const deleteQuiz = (courseId, lessonId) => api.delete(quizBase(courseId, lessonId));
export const addQuestion = (courseId, lessonId, data) => api.post(`${quizBase(courseId, lessonId)}/questions`, data);
export const updateQuestion = (courseId, lessonId, questionId, data) => api.put(`${quizBase(courseId, lessonId)}/questions/${questionId}`, data);
export const deleteQuestion = (courseId, lessonId, questionId) => api.delete(`${quizBase(courseId, lessonId)}/questions/${questionId}`);
