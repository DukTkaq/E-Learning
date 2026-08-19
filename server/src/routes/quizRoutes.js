const express = require('express');
const controller = require('../controllers/quizController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router({ mergeParams: true });
router.use(verifyToken, authorizeRoles('Instructor'));

router.get('/', controller.getQuiz);
router.post('/', controller.createQuiz);
router.put('/', controller.updateQuiz);
router.delete('/', controller.deleteQuiz);

router.post('/questions', controller.addQuestion);
router.put('/questions/:questionId', controller.updateQuestion);
router.delete('/questions/:questionId', controller.deleteQuestion);

module.exports = router;
