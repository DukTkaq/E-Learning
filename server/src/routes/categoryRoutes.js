const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.post('/', verifyToken, authorizeRoles('admin'), categoryController.createCategory);
// Read access is public because categories are shared by course discovery and
// the Instructor course form. Mutations remain Admin-only.
router.get('/', categoryController.getAllCategories);
router.put('/:id', verifyToken, authorizeRoles('admin'), categoryController.updateCategory);
router.delete('/:id', verifyToken, authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;
