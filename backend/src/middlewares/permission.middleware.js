const AppError = require('../utils/AppError');

function requirePermission(...requiredPermissions) {
  const permissions = requiredPermissions.filter(Boolean);
  return (request, _response, next) => {
    if (!request.user) return next(new AppError('Authentification requise', 401, 'AUTH_REQUIRED'));
    if (request.user.roles?.includes('admin')) return next();
    if (permissions.length === 0 || permissions.some((permission) => request.user.permissions?.includes(permission))) return next();
    return next(new AppError('Permission insuffisante', 403, 'FORBIDDEN'));
  };
}

module.exports = { requirePermission };
