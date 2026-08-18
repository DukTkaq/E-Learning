const express = require('express');
const controller = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRoles('Student'));

router.get('/', controller.get);
router.post('/items', controller.addItem);
router.delete('/items/:courseId', controller.removeItem);

module.exports = router;
