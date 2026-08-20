const express = require('express');
const controller = require('../controllers/learningController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRoles('Student'));
router.get('/courses/:courseId', controller.courseDetail);
router.get('/lessons/:lessonId', controller.lessonDetail);
router.post('/lessons/:lessonId/complete', controller.completeLesson);
router.get('/lessons/:lessonId/quiz', controller.getQuiz);
router.post('/quizzes/:quizId/attempts', controller.submitQuiz);
router.get('/certificates/:certificateId/download', controller.downloadCertificate);

module.exports = router;
