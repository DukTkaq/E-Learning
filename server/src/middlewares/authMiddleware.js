const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authenticateToken = async (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK';
    const decoded = jwt.verify(token, secret);
    
    // Check if user exists and is not banned
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, attributes: ['role_name'] }],
    });
    if (!user) {
      const error = new Error('User not found!');
      error.statusCode = 401;
      throw error;
    }

    if (String(user.status).toLowerCase() === 'banned') {
      const error = new Error('Your account has been banned or suspended. Please contact the Administrator via email admin@fpt.edu.vn for more details and support.');
      error.statusCode = 403;
      throw error;
    }

    return {
      ...decoded,
      role_id: user.role_id,
      role: user.Role?.role_name || decoded.role,
    };
  } catch (error) {
    throw error;
  }
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Token not found, access denied!' });
  try {
    req.user = await authenticateToken(authHeader.split(' ')[1] || authHeader);
    return next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({ message: error.statusCode ? error.message : 'Invalid or expired token!' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();
  try {
    req.user = await authenticateToken(authHeader.split(' ')[1] || authHeader);
    return next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({ message: error.statusCode ? error.message : 'Invalid or expired token!' });
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
};
