const { User, Role } = require('../models');

// [GET] /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar_url', 'status', 'created_at'],
      include: [
        {
          model: Role,
          attributes: ['role_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error while fetching users' });
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
    const { Course } = require('../models');

    // 1. Get role IDs
    const studentRole = await Role.findOne({ where: { role_name: 'Student' } });
    const instructorRole = await Role.findOne({ where: { role_name: 'Instructor' } });

    // 2. Count metrics
    const totalUsers = await User.count({ where: { role_id: studentRole?.role_id || 2 } });
    const totalInstructors = await User.count({ where: { role_id: instructorRole?.role_id || 3 } });
    const totalCourses = await Course.count();
    
    // Mock Revenue for now since we don't have a complex payment system populated yet
    const totalRevenue = totalCourses * 150; 

    // 3. Generate Chart Data based on range
    const chartData = [];
    let days = 7;
    if (range === 'last_30_days') days = 30;
    else if (range === 'year_to_date') days = new Date().getMonth() * 30 + new Date().getDate();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 500) + 50, // Mock daily revenue
        enrollments: Math.floor(Math.random() * 20) + 1, // Mock daily enrollments
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
    const users = await User.findAll({
      where: {
        status: 'Pending',
        role_id: studentRole?.id || 3
      },
      attributes: ['id', 'name', 'email', 'avatar_url', 'status', 'created_at', 'expertise', 'bio', 'portfolio_url'],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching instructor requests:', error);
    res.status(500).json({ message: 'Internal server error while fetching requests' });
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
