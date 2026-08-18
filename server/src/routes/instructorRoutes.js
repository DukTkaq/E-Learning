const express = require('express');
const controller = require('../controllers/instructorController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRoles('Instructor'));

router.get('/revenue', controller.revenue);
router.get('/reviews', controller.reviews);
router.put('/reviews/:id/reply', controller.replyToReview);

module.exports = router;
