const express = require('express');
const controller = require('../controllers/catalogController');
const { optionalAuth, verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.get('/', optionalAuth, controller.list);
router.get('/mine', verifyToken, authorizeRoles('Student'), controller.mine);
router.post('/:courseId/reviews', verifyToken, authorizeRoles('Student'), require('../controllers/learningController').createReview);
router.get('/:courseId', optionalAuth, controller.detail);

module.exports = router;
