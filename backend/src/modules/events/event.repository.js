const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').events;
const db = require('../../config/database');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { ACTIVE_ROLES } = require('../../config/activeRoles');

const repository=createRepository(config);
function identifier(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
  return `\`${value}\``;
}

function participantScopeWhere(userId, options = {}) {
  const conditions = [
    'e.deleted_at IS NULL',
    '(e.is_public = TRUE OR EXISTS (SELECT 1 FROM event_participants ep WHERE ep.event_id = e.id AND ep.user_id = ?))'
  ];
  const values = [userId];
  if (options.search && config.search?.length) {
    conditions.push(`(${config.search.map((field) => `e.${identifier(field)} LIKE ?`).join(' OR ')})`);
    config.search.forEach(() => values.push(`%${options.search}%`));
  }
  for (const field of config.filters || []) {
    if (options[field] !== undefined && options[field] !== '') {
      conditions.push(`e.${identifier(field)} = ?`);
      values.push(options[field]);
    }
  }
  return { where: `WHERE ${conditions.join(' AND ')}`, values };
}

repository.findAllForParticipant = async (userId, options = {}) => {
  const { page, limit, offset } = getPagination(options);
  const { where, values } = participantScopeWhere(userId, options);
  const sortable = new Set(['id', 'created_at', 'updated_at', ...config.fields]);
  const sortBy = sortable.has(options.sortBy) ? options.sortBy : 'starts_at';
  const direction = String(options.sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const count = await db.query(`SELECT COUNT(*) AS total FROM events e ${where}`, values);
  const rows = await db.query(`SELECT e.* FROM events e ${where} ORDER BY e.${identifier(sortBy)} ${direction} LIMIT ? OFFSET ?`, [...values, limit, offset]);
  return { rows, meta: getPaginationMeta(count[0].total, page, limit) };
};

repository.findByIdForParticipant = async (id, userId) => {
  const rows = await db.query(
    `SELECT e.* FROM events e
      WHERE e.id = ? AND e.deleted_at IS NULL
        AND (e.is_public = TRUE OR EXISTS (SELECT 1 FROM event_participants ep WHERE ep.event_id = e.id AND ep.user_id = ?))
      LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
};
repository.participants=(id)=>db.query(`SELECT ep.*,u.first_name,u.last_name,u.email FROM event_participants ep JOIN users u ON u.id=ep.user_id WHERE ep.event_id=? ORDER BY u.last_name`,[id]);
repository.upsertParticipant=(id,p)=>db.query(`INSERT INTO event_participants(event_id,user_id,response_status,responded_at) VALUES(?,?,COALESCE(?,'pending'),CASE WHEN ? IS NULL OR ?='pending' THEN NULL ELSE CURRENT_TIMESTAMP END) ON DUPLICATE KEY UPDATE response_status=VALUES(response_status),responded_at=VALUES(responded_at)`,[id,p.user_id,p.response_status||null,p.response_status||null,p.response_status||null]);
repository.removeParticipant=(id,userId)=>db.query('DELETE FROM event_participants WHERE event_id=? AND user_id=?',[id,userId]);
repository.findActiveStaffByIds = async (ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return db.query(
    `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
      WHERE u.id IN (${placeholders})
        AND u.deleted_at IS NULL
        AND u.status = 'active'
        AND r.is_active=TRUE AND r.code IN (${ACTIVE_ROLES.map(() => '?').join(',')})
      ORDER BY u.last_name, u.first_name`,
    [...ids, ...ACTIVE_ROLES]
  );
};
repository.activeStaff = () => db.query(
  `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.job_title
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
    WHERE u.deleted_at IS NULL
      AND u.status = 'active'
      AND r.is_active=TRUE AND r.code IN (${ACTIVE_ROLES.map(() => '?').join(',')})
    ORDER BY u.last_name, u.first_name`,
  ACTIVE_ROLES
);
repository.replaceParticipants = async (eventId, userIds) => db.transaction(async (connection) => {
  const [existingRows] = await connection.execute(
    `SELECT ep.user_id, u.first_name, u.last_name, u.email
       FROM event_participants ep
       JOIN users u ON u.id = ep.user_id
      WHERE ep.event_id = ?`,
    [eventId]
  );
  if (userIds.length) {
    const placeholders = userIds.map(() => '?').join(', ');
    await connection.execute(
      `DELETE FROM event_participants
        WHERE event_id = ? AND user_id NOT IN (${placeholders})`,
      [eventId, ...userIds]
    );
  } else {
    await connection.execute('DELETE FROM event_participants WHERE event_id = ?', [eventId]);
  }
  for (const userId of userIds) {
    await connection.execute(
      `INSERT INTO event_participants (event_id, user_id, response_status)
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE response_status = response_status`,
      [eventId, userId]
    );
  }
  return existingRows;
});
module.exports=repository;
