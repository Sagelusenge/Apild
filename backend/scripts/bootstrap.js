const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const BOOTSTRAP_NAME = 'base_schema_20260921';
const schemaFile = path.resolve(__dirname, '../../Apild_bd.sql');

function splitStatements(sql) {
  const output = [];
  let delimiter = ';';
  let buffer = '';

  for (const line of sql.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const delimiterMatch = line.trim().match(/^DELIMITER\s+(.+)$/i);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1].trim();
      continue;
    }

    buffer += `${line}\n`;
    if (!buffer.trimEnd().endsWith(delimiter)) continue;

    const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
    buffer = '';
    const executable = statement.replace(/^(?:\s*--[^\r\n]*(?:\r?\n|$))+/g, '').trim();
    if (!executable || /^(CREATE\s+DATABASE|USE)\b/i.test(executable)) continue;
    output.push(statement);
  }

  if (buffer.trim()) throw new Error('Le script SQL contient une instruction non terminée.');
  return output;
}

async function bootstrap() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const applied = await db.query('SELECT name FROM schema_migrations WHERE name = ?', [BOOTSTRAP_NAME]);
  if (applied.length) {
    console.log('Schéma de base déjà initialisé.');
    return;
  }

  const sql = fs.readFileSync(schemaFile, 'utf8');
  for (const statement of splitStatements(sql)) await db.pool.query(statement);
  await db.query('INSERT INTO schema_migrations (name) VALUES (?)', [BOOTSTRAP_NAME]);
  console.log('Schéma de base initialisé.');
}

bootstrap()
  .finally(() => db.close())
  .catch((error) => {
    console.error(`Échec d’initialisation : ${error.message}`);
    process.exitCode = 1;
  });
