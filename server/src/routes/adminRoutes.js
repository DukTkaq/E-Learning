const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Tất cả các route trong file này đều cần đăng nhập và phải có Role = 'Admin'
router.use(verifyToken);
router.use(authorizeRoles('Admin'));

// Quản lý Users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);

module.exports = router;
