const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register API
router.post('/register', authController.register);

// Login API
router.post('/login', authController.login);

// Logout API
router.post('/logout', authController.logout);

module.exports = router;
