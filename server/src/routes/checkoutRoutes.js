const express = require('express');
const controller = require('../controllers/checkoutController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.post('/', verifyToken, authorizeRoles('Student'), controller.checkout);

module.exports = router;
