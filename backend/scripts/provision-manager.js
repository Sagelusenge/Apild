const bcrypt = require('bcryptjs');
const db = require('../src/config/database');
const env = require('../src/config/env');

const email = 'sagelusenge@gmail.com';
const legacyPassword = 'password';

async function provisionManager() {
  const temporaryPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!temporaryPassword || temporaryPassword.length < 32 || temporaryPassword === legacyPassword) {
    throw new Error('ADMIN_INITIAL_PASSWORD doit être un secret aléatoire d’au moins 32 caractères.');
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, env.BCRYPT_ROUNDS);
  let outcome = 'Compte manager existant conservé.';

  await db.transaction(async (connection) => {
    const [roles] = await connection.execute('SELECT id FROM roles WHERE code = ? LIMIT 1', ['admin']);
    if (!roles.length) throw new Error('Le rôle admin est introuvable : initialisez d’abord le schéma.');

    const [users] = await connection.execute(
      'SELECT id, password_hash, deleted_at FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [email]
    );

    let userId;
    if (!users.length) {
      const [result] = await connection.execute(
        `INSERT INTO users
          (first_name, last_name, email, password_hash, must_change_password,
           job_title, status, email_verified_at)
         VALUES (?, ?, ?, ?, TRUE, ?, 'active', CURRENT_TIMESTAMP)`,
        ['Sagel', 'Usenge', email, passwordHash, 'Manager APILD']
      );
      userId = result.insertId;
      outcome = 'Compte manager créé avec un mot de passe temporaire aléatoire.';
    } else {
      userId = users[0].id;
      if (users[0].deleted_at) throw new Error('Le compte manager est supprimé : intervention manuelle requise.');
      if (await bcrypt.compare(legacyPassword, users[0].password_hash)) {
        await connection.execute(
          'UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?',
          [passwordHash, userId]
        );
        outcome = 'Ancien mot de passe de démonstration remplacé par un secret temporaire aléatoire.';
      }
    }

    await connection.execute(
      'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roles[0].id]
    );
  });

  console.log(outcome);
}

provisionManager()
  .finally(() => db.close())
  .catch((error) => {
    console.error(`Provisionnement manager échoué : ${error.message}`);
    process.exitCode = 1;
  });
