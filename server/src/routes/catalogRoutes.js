const express = require('express');
const controller = require('../controllers/catalogController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(verifyToken, authorizeRoles('Student'));

router.get('/', controller.list);
router.get('/mine', controller.mine);

module.exports = router;
