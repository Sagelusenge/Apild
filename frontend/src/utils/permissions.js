export const hasPermission = (user, permission) => !permission || user?.permissions?.includes(permission);
export const hasRole = (user, roles) => roles.some((role) => user?.roles?.includes(role));

export const homeForUser = (user) => {
  if (hasRole(user, ['admin'])) return '/admin';
  if (hasRole(user, ['communication'])) return '/communication';
  if (hasRole(user, ['manager'])) return '/admin';
  return '/staff';
};
