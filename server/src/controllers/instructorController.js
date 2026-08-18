const { QueryTypes } = require('sequelize');
const { Review, Course, User, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const parseDateFilter = (value, fieldName) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `${fieldName} must be a valid date.`);
  return date;
};

const getRevenueData = async (instructorId, filters = {}) => {
  const from = parseDateFilter(filters.from, 'from');
  const to = parseDateFilter(filters.to, 'to');
  if (from && to && from > to) throw new AppError(400, 'from must be before to.');

  const replacements = { instructorId, from, to };
  const dateFilter = `${from ? 'and p.created_at >= :from' : ''} ${to ? 'and p.created_at <= :to' : ''}`;

  const courses = await sequelize.query(`
    select
      c.id,
      c.title,
      count(p.id)::integer as sales,
      coalesce(sum(p.amount), 0)::numeric as revenue
    from public.courses c
    left join public.payments p
      on p.course_id = c.id
      and p.status = 'Success'
      ${dateFilter}
    where c.instructor_id = :instructorId
    group by c.id, c.title
    order by revenue desc, c.title asc
  `, { replacements, type: QueryTypes.SELECT });

  const trend = await sequelize.query(`
    select
      date(p.created_at) as date,
      count(p.id)::integer as sales,
      coalesce(sum(p.amount), 0)::numeric as revenue
    from public.payments p
    join public.courses c on c.id = p.course_id
    where c.instructor_id = :instructorId
      and p.status = 'Success'
      ${dateFilter}
    group by date(p.created_at)
    order by date(p.created_at) asc
  `, { replacements, type: QueryTypes.SELECT });

  return {
    summary: {
      total_revenue: courses.reduce((sum, row) => sum + Number(row.revenue), 0),
      total_sales: courses.reduce((sum, row) => sum + Number(row.sales), 0),
      course_count: courses.length,
    },
    courses,
    trend,
  };
};

const listInstructorReviews = (instructorId) => Review.findAll({
  include: [
    {
      model: Course,
      where: { instructor_id: instructorId },
      attributes: ['id', 'title'],
      required: true,
    },
    { model: User, attributes: ['id', 'name', 'avatar_url'] },
  ],
  order: [['created_at', 'DESC']],
});

const saveReviewReply = async (reviewId, instructorId, reply) => {
  const cleanReply = String(reply || '').trim();
  if (!cleanReply || cleanReply.length > 2000) {
    throw new AppError(400, 'Reply must be between 1 and 2000 characters.');
  }

  const review = await Review.findOne({
    where: { id: reviewId },
    include: [{
      model: Course,
      where: { instructor_id: instructorId },
      attributes: ['id', 'title'],
      required: true,
    }],
  });
  if (!review) throw new AppError(404, 'Review not found.');

  await review.update({
    instructor_reply: cleanReply,
    replied_at: new Date(),
    updated_at: new Date(),
  });
  return review;
};

exports.revenue = asyncHandler(async (req, res) => {
  res.json(await getRevenueData(req.user.id, req.query));
});

exports.reviews = asyncHandler(async (req, res) => {
  res.json({ reviews: await listInstructorReviews(req.user.id) });
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const review = await saveReviewReply(req.params.id, req.user.id, req.body.reply);
  res.json({ message: 'Reply saved successfully.', review });
});
