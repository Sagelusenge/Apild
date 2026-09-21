const db = require('../../config/database');

async function findUserByEmail(email) {
  const rows = await db.query(
    `SELECT id, first_name, last_name, email, phone, password_hash, must_change_password, job_title, status, email_verified_at
       FROM users
      WHERE email = ? AND deleted_at IS NULL
      LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const rows = await db.query(
    `SELECT id, first_name, last_name, email, phone, avatar_url, must_change_password, job_title, status, email_verified_at, last_login_at, created_at
       FROM users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getAccess(userId) {
  const rows = await db.query('SELECT role_code, permission_code FROM v_user_permissions WHERE user_id = ?', [userId]);
  return {
    roles: [...new Set(rows.map((row) => row.role_code))],
    permissions: [...new Set(rows.map((row) => row.permission_code))]
  };
}

async function createStaffUser(payload) {
  return db.transaction(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, status, email_verified_at)
       VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
      [payload.first_name, payload.last_name, payload.email, payload.phone || null, payload.password_hash]
    );
    await connection.execute(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT ?, id FROM roles WHERE code = 'staff'`,
      [result.insertId]
    );
    return result.insertId;
  });
}

function updateLastLogin(userId) {
  return db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
}

async function updateProfile(userId, { first_name, last_name, job_title }) {
  const result = await db.query(
    `UPDATE users
        SET first_name = ?, last_name = ?, job_title = ?
      WHERE id = ? AND deleted_at IS NULL`,
    [first_name, last_name, job_title || null, userId]
  );
  return result.affectedRows > 0;
}

async function updateAvatar(userId, avatarUrl) {
  const result = await db.query(
    'UPDATE users SET avatar_url = ? WHERE id = ? AND deleted_at IS NULL',
    [avatarUrl, userId]
  );
  return result.affectedRows > 0;
}

function storeRefreshToken(userId, tokenHash, expiresAt, context) {
  return db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, context.ipAddress || null, context.userAgent || null]
  );
}

async function findRefreshToken(tokenHash) {
  const rows = await db.query(
    `SELECT id, user_id, expires_at
       FROM refresh_tokens
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

function revokeRefreshToken(tokenHash) {
  return db.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL', [tokenHash]);
}

function revokeAllUserTokens(userId) {
  return db.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL', [userId]);
}

function createPasswordResetToken(userId, tokenHash, expiresAt) {
  return db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

async function createPasswordResetCode(userId, tokenHash, codeHash, expiresAt) {
  return db.transaction(async (connection) => {
    // Only the newest verification code may be used.  Older requests are
    // consumed before the new one is inserted, without ever storing the code.
    await connection.execute(
      `UPDATE password_reset_tokens
          SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND used_at IS NULL`,
      [userId]
    );
    await connection.execute(
      `INSERT INTO password_reset_tokens (user_id, token_hash, verification_code_hash, verification_code_attempts, expires_at)
       VALUES (?, ?, ?, 0, ?)`,
      [userId, tokenHash, codeHash, expiresAt]
    );
  });
}

async function findPasswordResetToken(tokenHash) {
  const rows = await db.query(
    `SELECT id, user_id
       FROM password_reset_tokens
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function findPasswordResetCode(userId, codeHash) {
  const rows = await db.query(
    `SELECT id, user_id
       FROM password_reset_tokens
      WHERE user_id = ?
        AND verification_code_hash = ?
        AND verification_code_attempts < 5
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId, codeHash]
  );
  return rows[0] || null;
}

function recordPasswordResetCodeFailure(userId) {
  return db.query(
    `UPDATE password_reset_tokens
        SET verification_code_attempts = LEAST(verification_code_attempts + 1, 5)
      WHERE user_id = ?
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP`,
    [userId]
  );
}

async function consumePasswordResetToken(tokenId, userId, passwordHash) {
  return db.transaction(async (connection) => {
    await connection.execute(
      'UPDATE users SET password_hash = ?, must_change_password = FALSE, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, userId]
    );
    await connection.execute('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [tokenId]);
    await connection.execute('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL', [userId]);
  });
}

async function changePassword(userId, passwordHash) {
  return db.transaction(async (connection) => {
    await connection.execute(
      'UPDATE users SET password_hash = ?, must_change_password = FALSE, password_changed_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [passwordHash, userId]
    );
    await connection.execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  });
}

module.exports = {
  findUserByEmail, findUserById, getAccess, createStaffUser, updateLastLogin,
  updateProfile, updateAvatar,
  storeRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens,
  createPasswordResetToken, createPasswordResetCode,
  findPasswordResetToken, findPasswordResetCode, recordPasswordResetCodeFailure,
  consumePasswordResetToken, changePassword
};
