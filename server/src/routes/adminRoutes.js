const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Tất cả các route trong file này đều cần đăng nhập và phải có Role = 1 (Admin)
router.use(authenticateToken);
router.use(authorizeRoles(1));

// Quản lý Users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);

module.exports = router;
