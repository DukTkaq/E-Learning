const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register API
router.post('/register', authController.register);

module.exports = router;
