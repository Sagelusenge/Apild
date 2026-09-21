const db = require('../../config/database');
const { createRepository } = require('../../utils/crudFactory');

const repository = createRepository({
  table: 'roles', entityName: 'role', softDelete: false,
  fields: ['code', 'name', 'description', 'is_system'],
  search: ['code', 'name', 'description'], filters: ['is_system']
});

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
