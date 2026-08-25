const REPLY_FILTERS = new Set(['all', 'awaiting', 'replied']);
const REVIEW_SORTS = new Set(['newest', 'oldest', 'rating_desc', 'rating_asc']);

const parseInstructorReviewFilters = (filters = {}) => {
  const search = String(filters.search || '').trim();
  const replyStatus = String(filters.reply_status || 'all').trim();
  const sort = String(filters.sort || 'newest').trim();
  const ratingValue = String(filters.rating || '').trim();

  if (search.length > 100) throw new Error('Review search must not exceed 100 characters.');
  if (!REPLY_FILTERS.has(replyStatus)) throw new Error('Invalid reply status filter.');
  if (!REVIEW_SORTS.has(sort)) throw new Error('Invalid review sort option.');

  let rating = null;
  if (ratingValue) {
    rating = Number(ratingValue);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating filter must be an integer from 1 to 5.');
    }
  }

  return { search, replyStatus, rating, sort };
};

module.exports = { parseInstructorReviewFilters };
