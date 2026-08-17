/**
 * Middleware phân quyền (Role-Based Access Control)
 * Dùng chung cho toàn bộ dự án.
 * Yêu cầu: Phải đặt sau middleware verifyToken trong Route.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is created from verifyToken
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Cannot verify access rights. Please log in again!' });
    }

    const hasPermission = allowedRoles.some(
      role => role.toLowerCase() === req.user.role.toLowerCase()
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have the required role to perform this action!' 
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
