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
