const asyncHandler = require('../utils/asyncHandler');
const instructorService = require('../services/instructorService');

exports.revenue = asyncHandler(async (req, res) => {
  res.json(await instructorService.getRevenue(req.user.id, req.query));
});

exports.reviews = asyncHandler(async (req, res) => {
  res.json({ reviews: await instructorService.listReviews(req.user.id) });
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const review = await instructorService.replyToReview(req.params.id, req.user.id, req.body.reply);
  res.json({ message: 'Reply saved successfully.', review });
});
