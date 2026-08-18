const asyncHandler = require('../utils/asyncHandler');
const courseService = require('../services/courseService');
const thumbnailService = require('../services/courseThumbnailService');

exports.list = asyncHandler(async (req, res) => {
  const courses = await courseService.listCourses(req.user.id);
  res.json({ courses });
});

exports.get = asyncHandler(async (req, res) => {
  const course = await courseService.findOwnedCourse(req.params.id, req.user.id);
  res.json({ course });
});

exports.create = asyncHandler(async (req, res) => {
  const uploadedThumbnail = await thumbnailService.uploadThumbnail(req.file, req.user.id);
  try {
    const course = await courseService.createCourse(req.user.id, {
      ...req.body,
      ...(uploadedThumbnail ? { thumbnail: uploadedThumbnail.publicUrl } : {}),
    });
    res.status(201).json({ message: 'Course submitted for approval.', course });
  } catch (error) {
    if (uploadedThumbnail) {
      thumbnailService.removeThumbnail(uploadedThumbnail.objectPath).catch((cleanupError) => {
        console.error('Could not remove the unused course thumbnail:', cleanupError);
      });
    }
    throw error;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const uploadedThumbnail = await thumbnailService.uploadThumbnail(req.file, req.user.id);
  let existingCourse;
  let course;
  try {
    existingCourse = await courseService.findOwnedCourse(req.params.id, req.user.id);
    course = await courseService.updateCourse(req.params.id, req.user.id, {
      ...req.body,
      ...(uploadedThumbnail ? { thumbnail: uploadedThumbnail.publicUrl } : {}),
    });
  } catch (error) {
    if (uploadedThumbnail) {
      thumbnailService.removeThumbnail(uploadedThumbnail.objectPath).catch((cleanupError) => {
        console.error('Could not remove the unused course thumbnail:', cleanupError);
      });
    }
    throw error;
  }

  if (uploadedThumbnail && existingCourse.thumbnail !== uploadedThumbnail.publicUrl) {
    thumbnailService.removeThumbnail(existingCourse.thumbnail).catch((error) => {
      console.error('Could not remove previous course thumbnail:', error);
    });
  }
  res.json({ message: 'Course updated successfully.', course });
});

exports.hide = asyncHandler(async (req, res) => {
  const course = await courseService.hideCourse(req.params.id, req.user.id);
  res.json({ message: 'Course hidden successfully.', course });
});
