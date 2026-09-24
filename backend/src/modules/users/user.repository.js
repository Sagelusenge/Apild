const db = require('../../config/database');
const { createRepository } = require('../../utils/crudFactory');
const { ACTIVE_ROLES } = require('../../config/activeRoles');

const config = {
  table: 'users', entityName: 'utilisateur', softDelete: true,
  fields: ['first_name', 'last_name', 'email', 'phone', 'password_hash', 'must_change_password', 'avatar_url', 'job_title', 'status', 'email_verified_at'],
  selectFields: ['id', 'first_name', 'last_name', 'email', 'phone', 'must_change_password', 'avatar_url', 'job_title', 'status', 'email_verified_at', 'last_login_at', 'created_at', 'updated_at'],
  search: ['first_name', 'last_name', 'email', 'phone', 'job_title'], filters: ['status']
};

const repository = createRepository(config);

repository.findByEmail = async (email) => {
  const rows = await db.query('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1', [email]);
  return rows[0] || null;
};

repository.getRoles = async (userId) => db.query(
  `SELECT r.id, r.code, r.name
     FROM roles r JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ? AND r.code IN (${ACTIVE_ROLES.map(() => '?').join(',')}) ORDER BY r.name`,
  [userId, ...ACTIVE_ROLES]
);

repository.setRoles = async (userId, roleIds, assignedBy) => db.transaction(async (connection) => {
  await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
  for (const roleId of roleIds) {
    await connection.execute(
      'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
      [userId, roleId, assignedBy]
    );
  }
});

repository.setStatus = async (userId, status, { revokeSessions = false } = {}) => db.transaction(async (connection) => {
  const [result] = await connection.execute(
    'UPDATE users SET status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, userId]
  );
  if (!result.affectedRows) return false;
  if (revokeSessions) {
    await connection.execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }
  return true;
});

repository.setPassword = async (userId, passwordHash, { mustChangePassword = true } = {}) => db.transaction(async (connection) => {
  const [result] = await connection.execute(
    `UPDATE users
        SET password_hash = ?,
            must_change_password = ?,
            password_changed_at = CASE WHEN ? THEN password_changed_at ELSE CURRENT_TIMESTAMP END
      WHERE id = ? AND deleted_at IS NULL`,
    [passwordHash, mustChangePassword ? 1 : 0, mustChangePassword ? 1 : 0, userId]
  );
  if (result.affectedRows) {
    await connection.execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }
  return result.affectedRows > 0;
});

module.exports = repository;
