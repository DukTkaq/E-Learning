const express = require('express');
const controller = require('../controllers/checkoutController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.get('/vnpay/ipn', controller.vnpayIpn);
router.get('/vnpay/return', controller.vnpayReturn);
router.post('/vnpay', verifyToken, authorizeRoles('Student'), controller.createVnpayPayment);
router.get('/vnpay/:checkoutRef/status', verifyToken, authorizeRoles('Student'), controller.getVnpayPaymentStatus);

module.exports = router;
