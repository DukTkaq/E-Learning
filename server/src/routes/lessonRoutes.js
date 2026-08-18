const express = require('express');
const controller = require('../controllers/lessonController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { videoUpload } = require('../middlewares/uploadMiddleware');

const router = express.Router({ mergeParams: true });
router.use(verifyToken, authorizeRoles('Instructor'));

router.get('/', controller.list);
router.post('/', videoUpload.single('video'), controller.create);
router.put('/:id', videoUpload.single('video'), controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/move-up', controller.moveUp);
router.patch('/:id/move-down', controller.moveDown);

module.exports = router;
