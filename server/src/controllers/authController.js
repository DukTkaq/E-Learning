const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const nodemailer = require('nodemailer');

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

    // Check if user is banned
    if (user.status === 'Banned') {
      return res.status(403).json({ message: 'Your account has been banned. Please contact the Administrator!' });
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
          role_id: user.role_id,
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
        role_id: user.role_id,
        role: user.Role ? user.Role.role_name : null,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // With JWT, logout is primarily handled client-side by deleting the token.
    res.json({ message: 'Logout successful!' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty!' });
    }

    const user = await User.findByPk(userId, {
      include: [{ model: Role }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    user.name = name.trim();
    
    // Check if an avatar was uploaded
    if (req.file) {
      // The file is saved in public/uploads/avatars/filename
      // We store the relative URL in the DB: /uploads/avatars/filename
      user.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role ? user.Role.role_name : null,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Error during profile update:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required!' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password!' });
    }

    // Validate New Password (At least 8 characters, letters and numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long and contain letters and numbers!' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Error during password change:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email cannot be empty!' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: 'Email does not exist!' });
    }

    // Create JWT token for password reset
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK',
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Send email using nodemailer if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"E-Learning Platform" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Password Reset</h2>
            <p>You recently requested to reset your password for your E-Learning account.</p>
            <p>Click the button below to reset it. This link is valid for 15 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${user.email}`);
    } else {
      // Fallback: print to console if no SMTP configured
      console.log(`\n==========================================`);
      console.log(`[NO SMTP CONFIGURED] PASSWORD RESET LINK FOR ${user.email}:`);
      console.log(resetLink);
      console.log(`==========================================\n`);
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required!' });
    }

    // Validate New Password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long and contain letters and numbers!' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token!' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Error during reset password:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
