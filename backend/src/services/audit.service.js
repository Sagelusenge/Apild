const db = require('../config/database');

function log({ actorUserId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }) {
  return db.query(
    `INSERT INTO audit_logs
       (actor_user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actorUserId || null, action, entityType, entityId || null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null, userAgent || null
    ]
  );
}

module.exports = { log };
