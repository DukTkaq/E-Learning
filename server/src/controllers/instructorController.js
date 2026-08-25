const { Op, QueryTypes } = require('sequelize');
const { Review, Course, User, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');
const { parseInstructorReviewFilters } = require('../rules/instructorReviewRules');

const REVENUE_SORTS = new Set(['revenue_desc', 'sales_desc', 'title_asc']);
const REVENUE_ACTIVITY = new Set(['all', 'sold', 'no_sales']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseDateFilter = (value, fieldName, endOfDay = false) => {
  if (!value) return null;
  const cleanValue = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(cleanValue)
    ? new Date(`${cleanValue}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    : new Date(cleanValue);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `${fieldName} must be a valid date.`);
  return date;
};

const filterAndSortRevenueCourses = (courses, filters = {}) => {
  const search = String(filters.course_search || '').trim().toLowerCase();
  const sort = String(filters.sort || 'revenue_desc').trim();
  const activity = String(filters.activity || 'sold').trim();

  if (!REVENUE_SORTS.has(sort)) throw new AppError(400, 'Invalid revenue sort option.');
  if (!REVENUE_ACTIVITY.has(activity)) throw new AppError(400, 'Invalid course sales filter.');

  const filtered = courses.filter((course) => {
    const matchesSearch = !search || course.title.toLowerCase().includes(search);
    const sales = Number(course.sales);
    const matchesActivity = activity === 'all'
      || (activity === 'sold' && sales > 0)
      || (activity === 'no_sales' && sales === 0);
    return matchesSearch && matchesActivity;
  });

  return filtered.sort((left, right) => {
    if (sort === 'title_asc') return left.title.localeCompare(right.title);
    if (sort === 'sales_desc') return Number(right.sales) - Number(left.sales) || left.title.localeCompare(right.title);
    return Number(right.revenue) - Number(left.revenue) || left.title.localeCompare(right.title);
  });
};

const getRevenueData = async (instructorId, filters = {}) => {
  const from = parseDateFilter(filters.from, 'from');
  const to = parseDateFilter(filters.to, 'to', true);
  if (from && to && from > to) throw new AppError(400, 'from must be before to.');
  const pagination = parsePagination(filters, { defaultLimit: 6, maxLimit: 50 });

  const replacements = { instructorId, from, to };
  const dateFilter = `${from ? 'and p.created_at >= :from' : ''} ${to ? 'and p.created_at <= :to' : ''}`;

  const allCourses = await sequelize.query(`
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

  const filteredCourses = filterAndSortRevenueCourses(allCourses, filters);
  const courses = filteredCourses.slice(pagination.offset, pagination.offset + pagination.limit);
  const totalRevenue = allCourses.reduce((sum, row) => sum + Number(row.revenue), 0);
  const totalSales = allCourses.reduce((sum, row) => sum + Number(row.sales), 0);
  const coursesWithSales = allCourses.filter((row) => Number(row.sales) > 0).length;
  const topCourse = [...allCourses]
    .filter((row) => Number(row.sales) > 0)
    .sort((left, right) => Number(right.revenue) - Number(left.revenue))[0] || null;

  return {
    summary: {
      total_revenue: totalRevenue,
      total_sales: totalSales,
      average_order_value: totalSales ? totalRevenue / totalSales : 0,
      course_count: allCourses.length,
      courses_with_sales: coursesWithSales,
      top_course: topCourse,
    },
    courses,
    trend,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: filteredCourses.length,
    }),
  };
};

const REVIEW_SORT_ORDERS = {
  newest: [['created_at', 'DESC'], ['id', 'DESC']],
  oldest: [['created_at', 'ASC'], ['id', 'ASC']],
  rating_desc: [['rating', 'DESC'], ['created_at', 'DESC']],
  rating_asc: [['rating', 'ASC'], ['created_at', 'DESC']],
};

const getCourseReviews = async (courseId, instructorId, filters = {}) => {
  if (!UUID.test(String(courseId))) {
    throw new AppError(400, 'Course ID must be a valid UUID.');
  }

  const course = await Course.findOne({
    where: { id: courseId, instructor_id: instructorId },
    attributes: ['id', 'title', 'status'],
  });
  if (!course) throw new AppError(404, 'Course not found.');

  let reviewFilters;
  try {
    reviewFilters = parseInstructorReviewFilters(filters);
  } catch (error) {
    throw new AppError(400, error.message);
  }

  const pagination = parsePagination(filters, { defaultLimit: 4, maxLimit: 20 });
  const where = { course_id: courseId };
  if (reviewFilters.replyStatus === 'awaiting') where.instructor_reply = null;
  if (reviewFilters.replyStatus === 'replied') where.instructor_reply = { [Op.not]: null };
  if (reviewFilters.rating) where.rating = reviewFilters.rating;
  if (reviewFilters.search) {
    where[Op.or] = [
      { comment: { [Op.iLike]: `%${reviewFilters.search}%` } },
      { '$User.name$': { [Op.iLike]: `%${reviewFilters.search}%` } },
    ];
  }

  const [reviewPage, summaryRows] = await Promise.all([
    Review.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'], required: true }],
      order: REVIEW_SORT_ORDERS[reviewFilters.sort],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
      subQuery: false,
    }),
    Review.findAll({
      where: { course_id: courseId },
      attributes: ['rating', 'instructor_reply'],
    }),
  ]);

  const awaitingReply = summaryRows.filter((review) => !review.instructor_reply).length;
  const ratingTotal = summaryRows.reduce((sum, review) => sum + Number(review.rating), 0);
  const totalReviews = summaryRows.length;

  return {
    course,
    reviews: reviewPage.rows,
    summary: {
      total: totalReviews,
      awaiting_reply: awaitingReply,
      replied: totalReviews - awaitingReply,
      average_rating: totalReviews ? Number((ratingTotal / totalReviews).toFixed(1)) : 0,
    },
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems: reviewPage.count,
    }),
  };
};

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

exports.courseReviews = asyncHandler(async (req, res) => {
  res.json(await getCourseReviews(req.params.courseId, req.user.id, req.query));
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const review = await saveReviewReply(req.params.id, req.user.id, req.body.reply);
  res.json({ message: 'Reply saved successfully.', review });
});
