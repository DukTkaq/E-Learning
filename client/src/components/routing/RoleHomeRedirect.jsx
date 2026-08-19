import { Navigate } from 'react-router-dom';

const HOME_BY_ROLE = {
  1: '/admin/dashboard',
  2: '/instructor/courses',
  3: '/',
};

export default function RoleHomeRedirect() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!token || !storedUser) return <Navigate to="/" replace />;

  try {
    const user = JSON.parse(storedUser);
    return <Navigate to={HOME_BY_ROLE[user.role_id] || '/'} replace />;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
}
