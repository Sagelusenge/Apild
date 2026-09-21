const db = require('../../config/database');

async function list(user, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  if (!user.roles.includes('admin')) {
    conditions.push('user_id = ?');
    values.push(user.id);
  } else if (query.user_id) {
    conditions.push('user_id = ?');
    values.push(query.user_id);
  }
  if (query.is_read !== undefined) {
    conditions.push('is_read = ?');
    values.push(String(query.is_read) === 'true' ? 1 : 0);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const counts = await db.query(`SELECT COUNT(*) AS total FROM notifications ${where}`, values);
  const rows = await db.query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return { rows, meta: { total: counts[0].total, page, limit, totalPages: Math.ceil(counts[0].total / limit) } };
}

async function findById(id, user) {
  const values = [id];
  let owner = '';
  if (!user.roles.includes('admin')) { owner = 'AND user_id = ?'; values.push(user.id); }
  const rows = await db.query(`SELECT * FROM notifications WHERE id = ? ${owner} LIMIT 1`, values);
  return rows[0] || null;
}

async function create(payload) {
  const result = await db.query(
    `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
     VALUES (?, ?, ?, ?, ?)`,
    [payload.user_id, payload.notification_type, payload.title, payload.message, payload.link_url || null]
  );
  const rows = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function createForRoles(roleCodes, payload) {
  if (!roleCodes?.length) return 0;
  const placeholders = roleCodes.map(() => '?').join(', ');
  const result = await db.query(
    `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
     SELECT DISTINCT u.id, ?, ?, ?, ?
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
      WHERE u.deleted_at IS NULL
        AND u.status = 'active'
        AND r.code IN (${placeholders})`,
    [payload.notification_type, payload.title, payload.message, payload.link_url || null, ...roleCodes]
  );
  return result.affectedRows || 0;
}

async function markRead(id, user, isRead) {
  const values = [isRead ? 1 : 0, isRead ? new Date() : null, id];
  let owner = '';
  if (!user.roles.includes('admin')) { owner = 'AND user_id = ?'; values.push(user.id); }
  const result = await db.query(`UPDATE notifications SET is_read = ?, read_at = ? WHERE id = ? ${owner}`, values);
  return result.affectedRows > 0;
}

async function markAllRead(userId) {
  return db.query('UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = FALSE', [userId]);
}

async function remove(id, user) {
  const values = [id];
  let owner = '';
  if (!user.roles.includes('admin')) { owner = 'AND user_id = ?'; values.push(user.id); }
  const result = await db.query(`DELETE FROM notifications WHERE id = ? ${owner}`, values);
  return result.affectedRows > 0;
}

module.exports = { list, findById, create, createForRoles, markRead, markAllRead, remove };
