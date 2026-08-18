const express = require('express');
const adminController = require('../controllers/adminController');
const adminCourseController = require('../controllers/adminCourseController');
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

// Course approval workflow
router.get('/courses', adminCourseController.list);
router.patch('/courses/:id/status', adminCourseController.review);

// Route for getting dashboard metrics
router.get('/dashboard', adminController.getDashboardMetrics);

module.exports = router;
