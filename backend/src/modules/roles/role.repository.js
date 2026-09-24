const db = require('../../config/database');
const { createRepository } = require('../../utils/crudFactory');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const { ACTIVE_ROLES } = require('../../config/activeRoles');

const repository = createRepository({
  table: 'roles', entityName: 'role', softDelete: false,
  fields: ['code', 'name', 'description', 'is_system'],
  search: ['code', 'name', 'description'], filters: ['is_system']
});

repository.findAll = async (options = {}) => {
  const { page, limit, offset } = getPagination(options);
  const search = String(options.search || '').trim();
  const where = `WHERE is_active = TRUE AND code IN (${ACTIVE_ROLES.map(() => '?').join(',')})`
    + (search ? ' AND (code LIKE ? OR name LIKE ? OR description LIKE ?)' : '');
  const params = [...ACTIVE_ROLES, ...(search ? Array(3).fill(`%${search}%`) : [])];
  const counts = await db.query(`SELECT COUNT(*) AS total FROM roles ${where}`, params);
  const rows = await db.query(`SELECT * FROM roles ${where} ORDER BY FIELD(code,'admin','communication','rh') LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { rows, meta: getPaginationMeta(counts[0].total, page, limit) };
};

const findById = repository.findById.bind(repository);
repository.findById = async (id) => {
  const role = await findById(id);
  return role?.is_active && ACTIVE_ROLES.includes(role.code) ? role : null;
};

repository.getPermissions = (roleId) => db.query(
  `SELECT p.id, p.code, p.module, p.action, p.description
     FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id
    WHERE rp.role_id = ? ORDER BY p.module, p.action`,
  [roleId]
);

repository.setPermissions = (roleId, permissionIds) => db.transaction(async (connection) => {
  await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  for (const permissionId of permissionIds) {
    await connection.execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permissionId]);
  }
});

repository.listPermissions = () => db.query('SELECT * FROM permissions ORDER BY module, action');

module.exports = repository;
