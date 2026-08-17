const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.post('/', verifyToken, authorizeRoles('admin'), categoryController.createCategory);
router.get('/', verifyToken, authorizeRoles('admin'), categoryController.getAllCategories);
router.put('/:id', verifyToken, authorizeRoles('admin'), categoryController.updateCategory);

module.exports = router;
