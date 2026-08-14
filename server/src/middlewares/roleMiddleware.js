/**
 * Middleware phân quyền (Role-Based Access Control)
 * Dùng chung cho toàn bộ dự án.
 * Yêu cầu: Phải đặt sau middleware verifyToken trong Route.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user được tạo ra từ verifyToken
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Không thể xác thực quyền truy cập. Vui lòng đăng nhập lại!' });
    }

    const hasPermission = allowedRoles.includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: Bạn không có quyền (Role) để thực hiện thao tác này!' 
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
