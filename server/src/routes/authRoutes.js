const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken } = require('../middlewares/authMiddleware');
const { avatarUpload } = require('../middlewares/uploadMiddleware');

// Register API
router.post('/register', authController.register);

// Login API
router.post('/login', authController.login);

// Logout API
router.post('/logout', authController.logout);

// Update Profile API
router.put('/profile', verifyToken, avatarUpload.single('avatar'), authController.updateProfile);

// Change Password API
router.put('/change-password', verifyToken, authController.changePassword);

// Forgot Password API
router.post('/forgot-password', authController.forgotPassword);

// Reset Password API
router.post('/reset-password', authController.resetPassword);

// Get Profile Stats API
router.get('/profile/stats', verifyToken, authController.getProfileStats);

// Apply to become an instructor API
router.post('/apply-instructor', verifyToken, authController.applyInstructor);

module.exports = router;
