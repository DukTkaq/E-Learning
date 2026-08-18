const express = require('express');
const controller = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.get('/', verifyToken, authorizeRoles('Student'), controller.history);
module.exports = router;
