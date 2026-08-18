/**
 * Role-Based Access Control (RBAC) Middleware
 * Used across the entire project.
 * Requirement: Must be placed after verifyToken middleware in Routes.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by verifyToken
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Cannot verify access rights. Please log in again!' });
    }

    const hasPermission = allowedRoles.some(
      role => role.toLowerCase() === req.user.role.toLowerCase()
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have the required Role to perform this action!' 
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
