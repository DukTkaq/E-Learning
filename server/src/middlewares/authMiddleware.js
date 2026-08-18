const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token not found, access denied!' });
  }

  // Token format: "Bearer <token>"
  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const secret = process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK';
    const decoded = jwt.verify(token, secret);
    
    // Check if user exists and is not banned
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, attributes: ['role_name'] }],
    });
    if (!user) {
      return res.status(401).json({ message: 'User not found!' });
    }

    if (String(user.status).toLowerCase() === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned or suspended. Please contact the Administrator via email admin@fpt.edu.vn for more details and support.' });
    }

    // Save user info into request
    req.user = {
      ...decoded,
      role_id: user.role_id,
      role: user.Role?.role_name || decoded.role,
    };
    next(); 
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token!' });
  }
};

module.exports = {
  verifyToken
};
