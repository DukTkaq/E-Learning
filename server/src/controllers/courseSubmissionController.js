const { Course, Lesson, Quiz, Question } = require('../models');
const { getCourseSubmissionIssues } = require('../rules/courseSubmissionRules');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const SUBMITTABLE_STATUSES = new Set(['Draft', 'Rejected']);

const findOwnedCourse = async (courseId, instructorId) => {
  const course = await Course.findOne({
    where: { id: courseId, instructor_id: instructorId },
  });
  if (!course) throw new AppError(404, 'Course not found.');
  return course;
};

const getCourseLessons = (courseId) => Lesson.findAll({
  where: { course_id: courseId },
  attributes: ['id', 'title', 'order_index', 'is_final'],
  include: [{
    model: Quiz,
    attributes: ['id'],
    required: false,
    include: [{ model: Question, attributes: ['id'], required: false }],
  }],
  order: [['order_index', 'ASC']],
});

exports.submit = asyncHandler(async (req, res) => {
  const course = await findOwnedCourse(req.params.id, req.user.id);

  if (!SUBMITTABLE_STATUSES.has(course.status)) {
    throw new AppError(409, 'Only draft or rejected courses can be submitted for approval.');
  }

  const lessons = await getCourseLessons(course.id);
  const issues = getCourseSubmissionIssues(
    course.get({ plain: true }),
    lessons.map((lesson) => lesson.get({ plain: true })),
  );

  if (issues.length) {
    throw new AppError(400, 'Complete the course before submitting it for approval.', issues);
  }

  await course.update({ status: 'Pending', updated_at: new Date() });
  res.json({ message: 'Course submitted for approval.', course });
});
