const AppError = require('../utils/AppError');

function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user) return next(new AppError('Authentification requise', 401, 'AUTH_REQUIRED'));
    if (request.user.roles?.some((role) => roles.includes(role))) return next();
    return next(new AppError('Role insuffisant', 403, 'FORBIDDEN'));
  };
}

module.exports = { requireRole };
