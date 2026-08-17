const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token not found, access denied!' });
  }

  // Token often looks like "Bearer <hash_string>"
  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const secret = process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK';
    const decoded = jwt.verify(token, secret);
    
    // Save user info into request for controllers to use
    req.user = decoded; 
    next(); // Allow proceeding to route
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token!' });
  }
};

module.exports = {
  verifyToken
};
