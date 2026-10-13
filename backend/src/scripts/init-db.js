import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { env } from '../config/env.js';
import { connectPostgres, disconnectPostgres, query } from '../config/postgres.js';
import { logger } from '../config/logger.js';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ensureDatabaseExists = async () => {
  const targetDb = env.POSTGRES.DATABASE;
  if (!targetDb || targetDb === 'postgres') return;

  const adminClient = new Client({
    host: env.POSTGRES.HOST,
    port: env.POSTGRES.PORT,
    user: env.POSTGRES.USER,
    password: env.POSTGRES.PASSWORD,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1;', [targetDb]);
    if (checkRes.rows.length === 0) {
      logger.info(`Database '${targetDb}' does not exist. Creating it automatically...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}";`);
      logger.info(`✅ Database '${targetDb}' created successfully!`);
    }
  } catch (err) {
    logger.debug(`Database check note: ${err.message}`);
  } finally {
    try {
      await adminClient.end();
    } catch {}
  }
};

export const initializeDatabase = async () => {
  await ensureDatabaseExists();
  logger.info('🚀 Connecting to PostgreSQL to initialize database schema...');
  const connected = await connectPostgres();

  if (!connected) {
    logger.error('❌ Could not connect to PostgreSQL. Please check database connection details.');
    process.exit(1);
  }

  const sqlPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(sqlPath)) {
    logger.error(`❌ Schema file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(sqlPath, 'utf8');

  try {
    logger.info('📦 Executing schema migrations and table definitions...');
    await query(schemaSql);

    // Verify created tables
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = result.rows.map((r) => r.table_name);
    logger.info(`✅ Successfully initialized PostgreSQL schema! (${tableNames.length} tables verified):`);
    tableNames.forEach((name) => logger.info(`   - ${name}`));
  } catch (error) {
    logger.error('❌ Failed to execute schema script:', error);
    process.exit(1);
  } finally {
    await disconnectPostgres();
  }
};

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      logger.info('🎉 Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database initialization error:', err);
      process.exit(1);
    });
}
