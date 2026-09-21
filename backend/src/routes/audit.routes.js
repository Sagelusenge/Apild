const express = require('express');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { success } = require('../utils/response');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const router = express.Router();
router.get('/', authenticate, requirePermission('audit.read'), asyncHandler(async (request, response) => {
  const { page, limit, offset } = getPagination(request.query);
  const conditions = [];
  const params = [];
  if (request.query.action) { conditions.push('a.action=?'); params.push(request.query.action); }
  if (request.query.entity_type) { conditions.push('a.entity_type=?'); params.push(request.query.entity_type); }
  if (request.query.actor_user_id) { conditions.push('a.actor_user_id=?'); params.push(request.query.actor_user_id); }
  if (request.query.search) {
    const term = `%${String(request.query.search).trim()}%`;
    conditions.push(`(
      a.action LIKE ? OR a.entity_type LIKE ? OR CAST(a.entity_id AS CHAR) LIKE ?
      OR CONCAT_WS(' ', u.first_name, u.last_name) LIKE ? OR u.email LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const join = 'FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id';
  const count = await db.query(`SELECT COUNT(*) total ${join} ${where}`, params);
  const rows = await db.query(`SELECT a.*,u.first_name,u.last_name,u.email ${join} ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return success(response, rows, 'Journal charge', 200, getPaginationMeta(count[0].total, page, limit));
}));

router.get('/filters', authenticate, requirePermission('audit.read'), asyncHandler(async (_request, response) => {
  const [actions, entities] = await Promise.all([
    db.query('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC'),
    db.query('SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type ASC')
  ]);
  return success(response, {
    actions: actions.map((row) => row.action),
    entities: entities.map((row) => row.entity_type)
  }, 'Filtres du journal charges');
}));

module.exports = router;
