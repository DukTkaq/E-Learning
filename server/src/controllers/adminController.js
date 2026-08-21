const { Op } = require('sequelize');
const { User, Role } = require('../models');
const AppError = require('../utils/AppError');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

const USER_STATUSES = new Set(['Active', 'Banned', 'Pending', 'Rejected']);
const USER_ROLES = new Set(['Admin', 'Instructor', 'Student']);

const buildUserWhere = async (filters = {}) => {
  const where = {};
  const search = String(filters.search || '').trim();
  const status = String(filters.status || '').trim();
  const role = String(filters.role || '').trim();

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (status) {
    if (!USER_STATUSES.has(status)) throw new AppError(400, 'Invalid user status filter.');
    where.status = status;
  }
  if (role) {
    if (!USER_ROLES.has(role)) throw new AppError(400, 'Invalid user role filter.');
    const roleRecord = await Role.findOne({ where: { role_name: role }, attributes: ['id'] });
    where.role_id = roleRecord?.id ?? -1;
  }

  return where;
};

const buildInstructorRequestWhere = (studentRoleId, filters = {}) => {
  const where = { status: 'Pending', role_id: studentRoleId };
  const search = String(filters.search || '').trim();
  const profile = String(filters.profile || '').trim();
  const filled = (field) => ({ [field]: { [Op.not]: null, [Op.ne]: '' } });

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { expertise: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (profile === 'complete') {
    where[Op.and] = [filled('expertise'), filled('bio'), filled('portfolio_url')];
  } else if (profile === 'incomplete') {
    where[Op.and] = [{
      [Op.or]: [
        { expertise: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } },
        { bio: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } },
        { portfolio_url: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } },
      ],
    }];
  } else if (profile) {
    throw new AppError(400, 'Invalid application profile filter.');
  }

  return where;
};

// [GET] /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, { defaultLimit: 8, maxLimit: 50 });
    const where = await buildUserWhere(req.query);
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'avatar_url', 'status', 'created_at'],
      include: [
        {
          model: Role,
          attributes: ['role_name']
        }
      ],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
    });

    const total = await User.count();
    res.status(200).json({
      users,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
      }),
      summary: { total },
    });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal server error while fetching users' });
  }
};

// [PUT] /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot ban your own account!' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    user.status = 'Banned';
    await user.save();

    res.status(200).json({ message: 'User banned successfully!', user });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Internal server error while banning user' });
  }
};

// [PUT] /api/admin/users/:id/unban
exports.unbanUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    user.status = 'Active';
    await user.save();

    res.status(200).json({ message: 'User unbanned successfully!', user });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Internal server error while unbanning user' });
  }
};

// [GET] /api/admin/dashboard
exports.getDashboardMetrics = async (req, res) => {
    try {
      const { range } = req.query; // 'last_7_days', 'last_30_days', 'year_to_date'
      const { Course, Payment, Enrollment, sequelize } = require('../models');
      const { Op } = require('sequelize');
  
      // 1. Get role IDs
      const studentRole = await Role.findOne({ where: { role_name: 'Student' } });
      const instructorRole = await Role.findOne({ where: { role_name: 'Instructor' } });
  
      // 2. Count metrics
      const totalUsers = await User.count({ where: { role_id: studentRole?.id || 3 } });
      const totalInstructors = await User.count({ where: { role_id: instructorRole?.id || 2 } });
      const totalCourses = await Course.count();
      
      const totalRevenueResult = await Payment.sum('amount', { where: { status: 'Success' } });
      const totalRevenue = totalRevenueResult || 0;
  
      // 3. Generate Chart Data based on range
      const chartData = [];
      let days = 7;
      if (range === 'last_30_days') days = 30;
      else if (range === 'year_to_date') days = new Date().getMonth() * 30 + new Date().getDate();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      const payments = await Payment.findAll({
        where: { status: 'Success', created_at: { [Op.gte]: startDate } },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('sum', sequelize.col('amount')), 'revenue']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        raw: true
      });
      const paymentMap = {};
      payments.forEach(p => { paymentMap[new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = Number(p.revenue); });

      const enrollments = await Enrollment.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        raw: true
      });
      const enrollmentMap = {};
      enrollments.forEach(e => { enrollmentMap[new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = Number(e.count); });
  
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        chartData.push({
          date: dateStr,
          revenue: paymentMap[dateStr] || 0,
          enrollments: enrollmentMap[dateStr] || 0,
        });
      }

    res.json({
      metrics: {
        totalUsers,
        totalInstructors,
        totalCourses,
        totalRevenue
      },
      chartData
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Internal server error while fetching dashboard metrics' });
  }
};

// [GET] /api/admin/instructor-requests
exports.getInstructorRequests = async (req, res) => {
  try {
    const studentRole = await Role.findOne({ where: { role_name: 'Student' } });
    const pagination = parsePagination(req.query, { defaultLimit: 8, maxLimit: 50 });
    const where = buildInstructorRequestWhere(studentRole?.id || 3, req.query);
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'avatar_url', 'status', 'created_at', 'expertise', 'bio', 'portfolio_url'],
      order: [['created_at', 'ASC'], ['id', 'ASC']],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    res.status(200).json({
      requests: users,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
      }),
      summary: { total: count },
    });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    console.error('Error fetching instructor requests:', error);
    return res.status(500).json({ message: 'Internal server error while fetching requests' });
  }
};

// [PUT] /api/admin/instructor-requests/:id/approve
exports.approveInstructor = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    if (user.status !== 'Pending') {
      return res.status(400).json({ message: 'User does not have a pending instructor application.' });
    }

    const instructorRole = await Role.findOne({ where: { role_name: 'Instructor' } });
    if (!instructorRole) {
      return res.status(500).json({ message: 'Instructor role not found in database.' });
    }

    user.role_id = instructorRole.id || 2;
    user.status = 'Active';
    await user.save();

    res.status(200).json({ message: 'Instructor request approved successfully!', user });
  } catch (error) {
    console.error('Error approving instructor request:', error);
    res.status(500).json({ message: 'Internal server error while approving request' });
  }
};

// [PUT] /api/admin/instructor-requests/:id/reject
exports.rejectInstructor = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    if (user.status !== 'Pending') {
      return res.status(400).json({ message: 'User does not have a pending instructor application.' });
    }

    user.status = 'Rejected';
    await user.save();

    res.status(200).json({ message: 'Instructor request rejected.', user });
  } catch (error) {
    console.error('Error rejecting instructor request:', error);
    res.status(500).json({ message: 'Internal server error while rejecting request' });
  }
};
