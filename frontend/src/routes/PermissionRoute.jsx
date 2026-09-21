import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { hasPermission, hasRole } from '../utils/permissions';

export default function PermissionRoute({ permission, roles = [] }) {
  const { user } = useAuth();
  const allowed = hasPermission(user, permission) && (!roles.length || hasRole(user, roles));
  return allowed ? <Outlet /> : <Navigate to="/portail" replace />;
}
