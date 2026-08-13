const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken } = require('../middlewares/authMiddleware');

// Register API
router.post('/register', authController.register);

// Login API
router.post('/login', authController.login);

// Logout API
router.post('/logout', authController.logout);

// Update Profile API
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
