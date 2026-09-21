const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').tasks;
const db = require('../../config/database');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

const repository = createRepository(config);

function identifier(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
  return `\`${value}\``;
}

function assignedTaskWhere(userId, options = {}) {
  const conditions = [
    't.deleted_at IS NULL',
    'EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = ?)'
  ];
  const values = [userId];

  if (options.search && config.search?.length) {
    conditions.push(`(${config.search.map((field) => `t.${identifier(field)} LIKE ?`).join(' OR ')})`);
    config.search.forEach(() => values.push(`%${options.search}%`));
  }

  for (const field of config.filters || []) {
    if (options[field] !== undefined && options[field] !== '') {
      conditions.push(`t.${identifier(field)} = ?`);
      values.push(options[field]);
    }
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, values };
}

repository.findAllAssignedTo = async (userId, options = {}) => {
  const { page, limit, offset } = getPagination(options);
  const { where, values } = assignedTaskWhere(userId, options);
  const sortableFields = new Set(['id', 'created_at', 'updated_at', ...config.fields]);
  const requestedSort = sortableFields.has(options.sortBy) ? options.sortBy : (config.defaultSort || 'created_at');
  const direction = String(options.sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const countRows = await db.query(`SELECT COUNT(*) AS total FROM tasks t ${where}`, values);
  const rows = await db.query(
    `SELECT t.* FROM tasks t ${where} ORDER BY t.${identifier(requestedSort)} ${direction} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return { rows, meta: getPaginationMeta(countRows[0].total, page, limit) };
};

repository.findByIdAssignedTo = async (id, userId) => {
  const rows = await db.query(
    `SELECT t.*
       FROM tasks t
      WHERE t.id = ?
        AND t.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = ?)
      LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
};

repository.updateAssignedTo = async (id, payload, userId) => {
  const allowedFields = new Set(config.fields);
  const entries = Object.entries(payload).filter(([key, value]) => allowedFields.has(key) && value !== undefined);
  if (!entries.length) return null;
  const updates = entries.map(([key]) => `${identifier(key)} = ?`).join(', ');
  const result = await db.query(
    `UPDATE tasks t
        SET ${updates}
      WHERE t.id = ?
        AND t.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = ?)`,
    [...entries.map(([, value]) => value), id, userId]
  );
  if (!result.affectedRows) return null;
  return repository.findByIdAssignedTo(id, userId);
};

repository.assignees = (id) => db.query(`SELECT u.id,u.first_name,u.last_name,u.email,ta.assigned_at FROM task_assignees ta JOIN users u ON u.id=ta.user_id WHERE ta.task_id=?`, [id]);
repository.assign = (id, userId, actorId) => db.query('CALL sp_assign_task(?, ?, ?)', [id, userId, actorId]);
repository.unassign = (id, userId) => db.query('DELETE FROM task_assignees WHERE task_id=? AND user_id=?', [id, userId]);
repository.comments = (id) => db.query(`SELECT c.*,u.first_name,u.last_name FROM task_comments c LEFT JOIN users u ON u.id=c.user_id WHERE c.task_id=? AND c.deleted_at IS NULL ORDER BY c.created_at`, [id]);
repository.addComment = async (id, userId, text) => {
  const result = await db.query('INSERT INTO task_comments (task_id,user_id,comment_text) VALUES (?,?,?)', [id,userId,text]);
  return (await db.query('SELECT * FROM task_comments WHERE id=?', [result.insertId]))[0];
};
repository.updateComment = async (commentId, text) => { const result=await db.query('UPDATE task_comments SET comment_text=? WHERE id=? AND deleted_at IS NULL',[text,commentId]); return result.affectedRows; };
repository.removeComment = async (commentId) => { const result=await db.query('UPDATE task_comments SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL',[commentId]); return result.affectedRows; };
repository.updateCommentForAssignee = async (commentId, text, userId) => {
  const result = await db.query(
    `UPDATE task_comments c
      JOIN task_assignees ta ON ta.task_id = c.task_id AND ta.user_id = ?
      JOIN tasks t ON t.id = c.task_id AND t.deleted_at IS NULL
       SET c.comment_text = ?
     WHERE c.id = ? AND c.user_id = ? AND c.deleted_at IS NULL`,
    [userId, text, commentId, userId]
  );
  return result.affectedRows;
};
repository.removeCommentForAssignee = async (commentId, userId) => {
  const result = await db.query(
    `UPDATE task_comments c
      JOIN task_assignees ta ON ta.task_id = c.task_id AND ta.user_id = ?
      JOIN tasks t ON t.id = c.task_id AND t.deleted_at IS NULL
       SET c.deleted_at = CURRENT_TIMESTAMP
     WHERE c.id = ? AND c.user_id = ? AND c.deleted_at IS NULL`,
    [userId, commentId, userId]
  );
  return result.affectedRows;
};

module.exports = repository;
