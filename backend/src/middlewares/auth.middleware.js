const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const { ACTIVE_ROLES } = require('../config/activeRoles');

async function authenticate(request, _response, next) {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentification requise', 401, 'AUTH_REQUIRED');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const users = await db.query(
      `SELECT id, first_name, last_name, email, phone, job_title, status, must_change_password
         FROM users
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1`,
      [payload.sub]
    );
    const user = users[0];
    if (!user || user.status !== 'active') {
      throw new AppError('Compte inexistant ou inactif', 401, 'ACCOUNT_INACTIVE');
    }

    const access = await db.query(
      `SELECT DISTINCT role_code, permission_code
         FROM v_user_permissions
        WHERE user_id = ? AND role_code IN (${ACTIVE_ROLES.map(() => '?').join(',')})`,
      [user.id, ...ACTIVE_ROLES]
    );
    user.must_change_password = Boolean(user.must_change_password);
    user.roles = [...new Set(access.map((row) => row.role_code))];
    user.permissions = [...new Set(access.map((row) => row.permission_code))];
    if (!user.roles.length) throw new AppError('Aucun role actif attribue. Contactez un administrateur.', 403, 'ROLE_REQUIRED');
    if (user.must_change_password && !request.allowPasswordChange && !request.optionalAuthentication) {
      throw new AppError('Vous devez definir un nouveau mot de passe avant de poursuivre', 403, 'MUST_CHANGE_PASSWORD');
    }
    request.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error.name === 'TokenExpiredError') return next(new AppError('Session expiree', 401, 'TOKEN_EXPIRED'));
    return next(new AppError('Jeton invalide', 401, 'INVALID_TOKEN'));
  }
}

function optionalAuthenticate(request, response, next) {
  if (!request.headers.authorization) return next();
  request.optionalAuthentication = true;
  return authenticate(request, response, next);
}

function allowPasswordChange(request, _response, next) {
  request.allowPasswordChange = true;
  next();
}

module.exports = { authenticate, optionalAuthenticate, allowPasswordChange };
