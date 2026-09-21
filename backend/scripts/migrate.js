const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const migrationsDirectory = path.resolve(__dirname, '../../database/migrations');

function statements(sql) {
  return sql
    .replace(/^\uFEFF/, '')
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.replace(/--[^\r\n]*/g, '').trim())
    .filter(Boolean);
}

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  if (!fs.existsSync(migrationsDirectory)) return [];
  const files = fs.readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const appliedRows = await db.query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.name));
  const completed = [];

  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = fs.readFileSync(path.join(migrationsDirectory, name), 'utf8');
    await db.transaction(async (connection) => {
      for (const statement of statements(sql)) await connection.query(statement);
      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
    });
    completed.push(name);
  }
  return completed;
}

migrate()
  .then((completed) => console.log(completed.length ? `Migrations appliquées : ${completed.join(', ')}` : 'Aucune migration à appliquer.'))
  .finally(() => db.close())
  .catch((error) => {
    console.error(`Échec de migration : ${error.message}`);
    process.exitCode = 1;
  });
