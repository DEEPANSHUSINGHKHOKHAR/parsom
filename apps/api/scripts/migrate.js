const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const env = require('../src/config/env');

const schemaDir = path.resolve(__dirname, '..', 'database', 'schema');

function createSslConfig() {
  if (!env.DB_SSL_CA) return undefined;

  return {
    ca: env.DB_SSL_CA,
    rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
  };
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

async function main() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
    ssl: createSslConfig(),
  });

  try {
    await ensureMigrationsTable(connection);

    const applied = await getAppliedMigrations(connection);
    const files = (await fs.readdir(schemaDir))
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const fullPath = path.join(schemaDir, file);
      const sql = await fs.readFile(fullPath, 'utf8');

      console.log(`Applying ${file}`);
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log('Migrations complete');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
