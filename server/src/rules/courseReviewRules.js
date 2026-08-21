const AppError = require('../utils/AppError');

const REVIEW_STATUSES = new Set(['Approved', 'Rejected']);
const MAX_REJECTION_REASON_LENGTH = 1000;

const getCourseReviewUpdate = ({ status, rejection_reason }) => {
  if (!REVIEW_STATUSES.has(status)) {
    throw new AppError(400, 'Course can only be approved or rejected.');
  }

  if (status === 'Approved') {
    return { status, rejection_reason: null };
  }

  const reason = String(rejection_reason || '').trim();
  if (!reason) {
    throw new AppError(400, 'A rejection reason is required.');
  }
  if (reason.length > MAX_REJECTION_REASON_LENGTH) {
    throw new AppError(400, `Rejection reason must not exceed ${MAX_REJECTION_REASON_LENGTH} characters.`);
  }

  return { status, rejection_reason: reason };
};

module.exports = { getCourseReviewUpdate, MAX_REJECTION_REASON_LENGTH };
