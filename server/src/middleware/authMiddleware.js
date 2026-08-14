const jwt = require('jsonwebtoken');

// Middleware xác thực JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Authentication token not found!' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token!' });
    }
    
    req.user = user; // Lưu thông tin user giải mã được vào request
    next();
  });
};

// Middleware kiểm tra quyền (Role)
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_id) {
      return res.status(403).json({ message: 'Unable to verify access rights!' });
    }

    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action!' });
    }

    next();
  };
};
