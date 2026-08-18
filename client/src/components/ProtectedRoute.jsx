import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    // Chưa đăng nhập -> Đá ra trang Login
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_id)) {
    // Không đủ quyền -> Đá về trang Home hoặc Login (tùy ý)
    // Tạm thời đá về /
    return <Navigate to="/" replace />;
  }

  // Đủ điều kiện -> Cho phép render các Route con
  return <Outlet />;
};

export default ProtectedRoute;
