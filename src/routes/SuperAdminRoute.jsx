import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SuperAdminRoute() {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
