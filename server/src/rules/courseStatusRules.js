const EDITABLE_STATUSES = new Set(['Draft', 'Rejected']);
const ENROLLED_LEARNING_STATUSES = new Set(['Approved', 'Hidden']);

const canEditCourse = (status) => EDITABLE_STATUSES.has(status);

const canEnrolledStudentLearn = (status) => ENROLLED_LEARNING_STATUSES.has(status);

const getCourseEditMessage = (status) => {
  if (status === 'Approved') return 'An approved course is locked and cannot be edited.';
  if (status === 'Pending') return 'A pending course cannot be edited until Admin reviews it.';
  if (status === 'Hidden') return 'A hidden course cannot be edited.';
  return 'This course cannot be edited in its current status.';
};

module.exports = {
  canEditCourse,
  canEnrolledStudentLearn,
  getCourseEditMessage,
};
