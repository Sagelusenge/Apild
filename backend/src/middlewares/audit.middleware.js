const auditService = require('../services/audit.service');
const logger = require('../utils/logger');

module.exports = function auditMutation(request, response, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return next();

  response.on('finish', () => {
    if (!request.user || response.statusCode < 200 || response.statusCode >= 300) return;
    const segments = request.path.split('/').filter(Boolean);
    // A focused workflow may provide a more meaningful audit record than the
    // generic HTTP verb.  The route still goes through this single writer, so
    // it cannot accidentally create a duplicate audit entry.
    const audit = request.auditMutation || {};
    const action = audit.action || (request.method === 'POST' ? 'create' : request.method === 'DELETE' ? 'delete' : 'update');
    auditService.log({
      actorUserId: request.user.id,
      action,
      entityType: audit.entityType || segments[0] || 'unknown',
      entityId: audit.entityId ?? (/^\d+$/.test(segments[1] || '') ? Number(segments[1]) : null),
      oldValues: audit.oldValues,
      newValues: audit.newValues,
      ipAddress: request.ip,
      userAgent: request.get('user-agent')
    }).catch((error) => logger.error({ err: error }, 'Echec de l audit de mutation'));
  });
  return next();
};
