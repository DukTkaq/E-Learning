const express = require('express');
const voucherController = require('../controllers/voucherController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Tất cả APIs liên quan đến Voucher đều yêu cầu quyền Instructor
router.use(verifyToken);
router.use(authorizeRoles('Instructor'));

router.get('/', voucherController.getVouchers);
router.post('/', voucherController.createVoucher);

module.exports = router;
