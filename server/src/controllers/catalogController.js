const asyncHandler = require('../utils/asyncHandler');
const catalogService = require('../services/catalogService');

exports.list = asyncHandler(async (req, res) => {
  const courses = await catalogService.listCatalog(req.user.id, req.query);
  res.json({ courses });
});

exports.mine = asyncHandler(async (req, res) => {
  const courses = await catalogService.listMyCourses(req.user.id);
  res.json({ courses });
});
