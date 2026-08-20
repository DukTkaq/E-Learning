const express = require('express');
const controller = require('../controllers/instructorCourseController');
const courseSubmissionController = require('../controllers/courseSubmissionController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const thumbnailUpload = require('../middlewares/courseThumbnailUpload');

const router = express.Router();
router.use(verifyToken, authorizeRoles('Instructor'));

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', thumbnailUpload.single('thumbnail'), controller.create);
router.put('/:id', thumbnailUpload.single('thumbnail'), controller.update);
router.post('/:id/submit', courseSubmissionController.submit);
router.patch('/:id/hide', controller.hide);

module.exports = router;
