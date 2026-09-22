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

async function mysqlCompatibleStatement(connection, sql) {
  const statement = sql.replace(/^(?:\s*--[^\r\n]*(?:\r?\n|$))+/g, '').trim();
  const alter = statement.match(/^ALTER\s+TABLE\s+`?([\w]+)`?\s+([\s\S]+)$/i);
  if (alter && /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(alter[2])) {
    const clauses = alter[2].split(/,\s*(?=ADD\s+COLUMN\b)/i);
    const missing = [];
    for (const clause of clauses) {
      const column = clause.match(/^ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?([\w]+)`?/i);
      if (!column) throw new Error(`Clause ALTER TABLE non prise en charge : ${clause.slice(0, 80)}`);
      const [existing] = await connection.execute(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
        [alter[1], column[1]]
      );
      if (!existing.length) missing.push(clause.replace(/IF\s+NOT\s+EXISTS\s+/i, ''));
    }
    return missing.length ? `ALTER TABLE ${alter[1]} ${missing.join(', ')}` : null;
  }

  const index = statement.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS\s+`?([\w]+)`?\s+ON\s+`?([\w]+)`?/i);
  if (index) {
    const [existing] = await connection.execute(
      `SELECT 1 FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
      [index[2], index[1]]
    );
    return existing.length ? null : statement.replace(/INDEX\s+IF\s+NOT\s+EXISTS/i, 'INDEX');
  }
  return sql;
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
      for (const statement of statements(sql)) {
        const compatible = await mysqlCompatibleStatement(connection, statement);
        if (compatible) await connection.query(compatible);
      }
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
