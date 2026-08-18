const asyncHandler = require('../utils/asyncHandler');
const adminCourseService = require('../services/adminCourseService');

exports.list = asyncHandler(async (req, res) => {
  const courses = await adminCourseService.listCourses(req.query);
  res.json({ courses });
});

exports.review = asyncHandler(async (req, res) => {
  const course = await adminCourseService.reviewCourse(req.params.id, req.body.status);
  res.json({ message: `Course ${course.status.toLowerCase()} successfully.`, course });
});
