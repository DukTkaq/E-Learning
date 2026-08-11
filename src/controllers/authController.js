const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tìm role 'student' (Giả sử mặc định đăng ký là học viên)
    // Nếu chưa có bảng roles thì tự sinh, ở đây giả định role = student có id = 2 (tùy DB của bạn)
    let defaultRole = await Role.findOne({ where: { role_name: 'student' } });
    let role_id = null;
    if (defaultRole) {
        role_id = defaultRole.id;
    }

    // Tạo user mới
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role_id: role_id
    });

    res.status(201).json({
      message: 'Đăng ký thành công!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email
    const user = await User.findOne({ 
        where: { email },
        include: [{ model: Role }] 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại!' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không chính xác!' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
          id: user.id, 
          email: user.email, 
          role: user.Role ? user.Role.role_name : null 
      },
      process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK', // Nên đặt ở .env
      { expiresIn: '1d' } // Token sống 1 ngày
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role ? user.Role.role_name : null
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  register,
  login
};
