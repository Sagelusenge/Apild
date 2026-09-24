const db = require('../../config/database');
const { createRepository } = require('../../utils/crudFactory');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const config = require('../../config/entities').documents;

const base = createRepository(config);
const storedFields = new Set(config.fields.filter((field) => field !== 'recipient_ids'));
const sortableFields = new Set(['id', 'created_at', 'updated_at', ...storedFields]);

function hydrate(row) {
  if (!row) return null;
  const recipientIds = row.recipient_ids_csv
    ? String(row.recipient_ids_csv).split(',').map(Number).filter(Number.isFinite)
    : [];
  const result = { ...row, recipient_ids: recipientIds };
  delete result.recipient_ids_csv;
  return result;
}

function visibleCondition(user, canManage, values) {
  if (canManage) return '1 = 1';
  values.push(user.id, user.id);
  return `(d.share_scope = 'team' OR d.uploaded_by = ? OR EXISTS (
    SELECT 1 FROM document_recipients access_dr
    WHERE access_dr.document_id = d.id AND access_dr.user_id = ?
  ))`;
}

async function replaceRecipients(connection, documentId, recipientIds, sharedBy) {
  await connection.execute('DELETE FROM document_recipients WHERE document_id = ?', [documentId]);
  if (!recipientIds.length) return;
  const placeholders = recipientIds.map(() => '?').join(', ');
  const [users] = await connection.execute(
    `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id AND r.code IN ('admin', 'communication', 'rh')
      WHERE u.id IN (${placeholders}) AND u.deleted_at IS NULL AND u.status = 'active'`,
    recipientIds
  );
  for (const user of users) {
    await connection.execute(
      'INSERT INTO document_recipients (document_id, user_id, shared_by) VALUES (?, ?, ?)',
      [documentId, user.id, sharedBy || null]
    );
  }
}

async function notifyRecipients(connection, document, recipientIds, uploaderId) {
  let ids = recipientIds;
  if (document.share_scope === 'team') {
    const [users] = await connection.execute(
      `SELECT DISTINCT u.id
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id AND r.code IN ('admin', 'communication', 'rh')
        WHERE u.deleted_at IS NULL AND u.status = 'active' AND u.id <> ?`,
      [uploaderId]
    );
    ids = users.map((user) => Number(user.id));
  } else if (document.share_scope === 'selected' && recipientIds.length) {
    const placeholders = recipientIds.map(() => '?').join(', ');
    const [users] = await connection.execute(
      `SELECT DISTINCT u.id
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id AND r.code IN ('admin', 'communication', 'rh')
        WHERE u.id IN (${placeholders}) AND u.deleted_at IS NULL AND u.status = 'active'`,
      recipientIds
    );
    ids = users.map((user) => Number(user.id));
  }
  for (const userId of [...new Set(ids.map(Number))].filter((id) => id && id !== Number(uploaderId))) {
    await connection.execute(
      `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
       VALUES (?, 'document_shared', 'Nouveau fichier partagé', ?, '/portail')`,
      [userId, `Le fichier « ${document.title} » a été partagé avec vous.`]
    );
  }
}

async function findById(id) {
  const rows = await db.query(
    `SELECT d.*,
            (SELECT GROUP_CONCAT(dr.user_id ORDER BY dr.user_id) FROM document_recipients dr WHERE dr.document_id = d.id) AS recipient_ids_csv
       FROM documents d
      WHERE d.id = ? AND d.deleted_at IS NULL
      LIMIT 1`,
    [id]
  );
  return hydrate(rows[0]);
}

async function findByIdForUser(id, user, canManage) {
  const values = [id];
  const visibility = visibleCondition(user, canManage, values);
  const rows = await db.query(
    `SELECT d.*,
            (SELECT GROUP_CONCAT(dr.user_id ORDER BY dr.user_id) FROM document_recipients dr WHERE dr.document_id = d.id) AS recipient_ids_csv
       FROM documents d
      WHERE d.id = ? AND d.deleted_at IS NULL AND ${visibility}
      LIMIT 1`,
    values
  );
  return hydrate(rows[0]);
}

async function findAllForUser(options, user, canManage) {
  const { page, limit, offset } = getPagination(options);
  const conditions = ['d.deleted_at IS NULL'];
  const values = [];
  conditions.push(visibleCondition(user, canManage, values));
  if (options.search) {
    conditions.push('(d.title LIKE ? OR d.description LIKE ? OR d.original_name LIKE ?)');
    values.push(...Array(3).fill(`%${options.search}%`));
  }
  for (const field of config.filters) {
    if (options[field] !== undefined && options[field] !== '') {
      conditions.push(`d.\`${field}\` = ?`);
      values.push(options[field]);
    }
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const requestedSort = sortableFields.has(options.sortBy) ? options.sortBy : 'created_at';
  const direction = String(options.sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const countRows = await db.query(`SELECT COUNT(*) AS total FROM documents d ${where}`, values);
  const rows = await db.query(
    `SELECT d.*,
            (SELECT GROUP_CONCAT(dr.user_id ORDER BY dr.user_id) FROM document_recipients dr WHERE dr.document_id = d.id) AS recipient_ids_csv
       FROM documents d ${where}
      ORDER BY d.\`${requestedSort}\` ${direction}
      LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return { rows: rows.map(hydrate), meta: getPaginationMeta(countRows[0].total, page, limit) };
}

async function createWithRecipients(payload, recipientIds, user) {
  const entries = Object.entries(payload).filter(([key, value]) => storedFields.has(key) && value !== undefined);
  const item = await db.transaction(async (connection) => {
    const columns = entries.map(([key]) => `\`${key}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const [result] = await connection.execute(
      `INSERT INTO documents (${columns}) VALUES (${placeholders})`,
      entries.map(([, value]) => value)
    );
    await replaceRecipients(connection, result.insertId, payload.share_scope === 'selected' ? recipientIds : [], user.id);
    await notifyRecipients(connection, payload, recipientIds, user.id);
    return { id: result.insertId };
  });
  return findById(item.id);
}

async function updateWithRecipients(id, payload, recipientIds, user) {
  await db.transaction(async (connection) => {
    const entries = Object.entries(payload).filter(([key, value]) => storedFields.has(key) && value !== undefined);
    if (entries.length) {
      const updates = entries.map(([key]) => `\`${key}\` = ?`).join(', ');
      await connection.execute(
        `UPDATE documents SET ${updates} WHERE id = ? AND deleted_at IS NULL`,
        [...entries.map(([, value]) => value), id]
      );
    }
    if (recipientIds !== undefined || payload.share_scope !== undefined) {
      const scopeRows = await connection.execute('SELECT share_scope FROM documents WHERE id = ?', [id]);
      const scope = payload.share_scope || scopeRows[0][0]?.share_scope;
      await replaceRecipients(connection, id, scope === 'selected' ? (recipientIds || []) : [], user.id);
    }
  });
  return findById(id);
}

module.exports = {
  ...base,
  findAllForUser,
  findById,
  findByIdForUser,
  createWithRecipients,
  updateWithRecipients
};
