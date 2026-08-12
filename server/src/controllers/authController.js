const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name cannot be empty!' });
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email cannot be empty!' });
    if (!password) return res.status(400).json({ message: 'Password cannot be empty!' });

    // Validate Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format!' });
    }

    // Validate Password (At least 8 characters, letters and numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain letters and numbers!' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find 'Student' role (Default role for registration)
    let defaultRole = await Role.findOne({ where: { role_name: 'Student' } });
    let role_id = null;
    if (defaultRole) {
        role_id = defaultRole.id;
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role_id: role_id
    });

    res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !email.trim()) return res.status(400).json({ message: 'Email cannot be empty!' });
    if (!password) return res.status(400).json({ message: 'Password cannot be empty!' });

    // Check email
    const user = await User.findOne({ 
        where: { email: email.trim().toLowerCase() },
        include: [{ model: Role }] 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Email does not exist!' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password!' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
          id: user.id, 
          email: user.email, 
          role: user.Role ? user.Role.role_name : null 
      },
      process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK', // Should be in .env
      { expiresIn: '1d' } // Token lives for 1 day
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role ? user.Role.role_name : null
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  register,
  login
};
