import useAuth from './useAuth';
import { hasPermission, hasRole } from '../utils/permissions';

export default function usePermissions() {
  const { user } = useAuth();
  return {
    can: (permission) => hasPermission(user, permission),
    inRole: (...roles) => hasRole(user, roles)
  };
}
