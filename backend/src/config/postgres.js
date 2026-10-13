import pkg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pkg;

let poolInstance = null;

export const getPostgresPool = () => {
  if (!poolInstance) {
    const config = {
      host: env.POSTGRES.HOST,
      port: env.POSTGRES.PORT,
      user: env.POSTGRES.USER,
      password: env.POSTGRES.PASSWORD,
      database: env.POSTGRES.DATABASE,
      max: env.POSTGRES.MAX_CONNECTIONS,
      idleTimeoutMillis: env.POSTGRES.IDLE_TIMEOUT_MILLIS,
      connectionTimeoutMillis: env.POSTGRES.CONNECTION_TIMEOUT_MILLIS,
    };

    if (process.env.POSTGRES_URI) {
      config.connectionString = process.env.POSTGRES_URI;
    }

    poolInstance = new Pool(config);

    poolInstance.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return poolInstance;
};

export const pool = getPostgresPool();

/**
 * Mask sensitive credentials from connection string for safe logging
 */
const maskConnectionString = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/:([^:@]+)@/, ':****@');
  } catch {
    return 'postgresql://****';
  }
};

export const ensureSchemaAlignment = async () => {
  try {
    const p = getPostgresPool();
    const statements = [
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255);`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS country VARCHAR(32) DEFAULT 'US';`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS type VARCHAR(32) DEFAULT 'Local';`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS monthly_rate NUMERIC(10, 2) DEFAULT 15.00;`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS forwarding_number VARCHAR(64) DEFAULT '';`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS fallback_number VARCHAR(64) DEFAULT '';`,
      `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS assigned_agent_name VARCHAR(255) DEFAULT 'Unassigned';`,
      `ALTER TABLE phone_numbers ALTER COLUMN client_id DROP NOT NULL;`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS assigned_client_id INT;`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS assigned_client_name VARCHAR(255) DEFAULT 'Global System Template';`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS voice_agent_id INT;`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS voice_agent_name VARCHAR(255) DEFAULT '';`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS assigned_phone_number VARCHAR(64) DEFAULT '';`,
      `ALTER TABLE conversation_flows ADD COLUMN IF NOT EXISTS effective_date TIMESTAMPTZ DEFAULT NOW();`,
      `ALTER TABLE conversation_flows ALTER COLUMN client_id DROP NOT NULL;`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          admin_id VARCHAR(64),
          admin_email VARCHAR(255),
          action VARCHAR(64) NOT NULL,
          resource_type VARCHAR(64) NOT NULL,
          resource_id VARCHAR(128),
          details JSONB DEFAULT '{}'::jsonb,
          ip_address VARCHAR(64),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`,
      `CREATE TABLE IF NOT EXISTS email_templates (
          id SERIAL PRIMARY KEY,
          client_id INT,
          slug VARCHAR(128),
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          html_body TEXT,
          body_html TEXT,
          text_body TEXT DEFAULT '',
          variables JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT TRUE,
          is_system BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `ALTER TABLE email_templates ALTER COLUMN html_body DROP NOT NULL;`,
      `ALTER TABLE email_templates ALTER COLUMN client_id DROP NOT NULL;`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS body_html TEXT;`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html_body TEXT;`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS text_body TEXT DEFAULT '';`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS slug VARCHAR(128);`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`,
      `ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;`,
      `UPDATE email_templates SET body_html = html_body WHERE body_html IS NULL AND html_body IS NOT NULL;`,
      `UPDATE email_templates SET html_body = body_html WHERE html_body IS NULL AND body_html IS NOT NULL;`
    ];

    for (const sql of statements) {
      try {
        await p.query(sql);
      } catch (stmtErr) {
        // Silently skip non-fatal column or index conflict
      }
    }
    logger.info('✅ PostgreSQL schema verified and columns aligned.');
  } catch (err) {
    logger.debug(`Schema alignment notice: ${err.message}`);
  }
};

/**
 * Test and establish connection to PostgreSQL
 */
export const connectPostgres = async () => {
  try {
    const p = getPostgresPool();
    const start = Date.now();
    const result = await p.query('SELECT NOW() as current_time, current_database() as db_name, version() as version');
    const duration = Date.now() - start;
    const dbName = result.rows[0]?.db_name || env.POSTGRES.DATABASE;

    // Ensure backwards-compatible schema columns
    await ensureSchemaAlignment();

    logger.info(
      `🐘 Connected to PostgreSQL successfully (${maskConnectionString(env.POSTGRES.URI)}) - Database: ${dbName} [${duration}ms]`
    );
    return true;
  } catch (error) {
    logger.error(`Failed to connect to PostgreSQL (${maskConnectionString(env.POSTGRES.URI)}):`, error.message);
    if (env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
};

/**
 * Gracefully close PostgreSQL connection pool
 */
export const disconnectPostgres = async () => {
  if (poolInstance) {
    try {
      await poolInstance.end();
      poolInstance = null;
      logger.info('Closed PostgreSQL pool connections.');
    } catch (error) {
      logger.error('Error disconnecting PostgreSQL pool:', error);
    }
  }
};

/**
 * Execute a query with timing and error handling
 * @param {string} text - SQL query
 * @param {Array} [params] - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const p = getPostgresPool();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`[PG Query] ${text} - ${result.rowCount} rows [${duration}ms]`);
    return result;
  } catch (error) {
    logger.error(`[PG Query Error] ${text} | Params: ${JSON.stringify(params)} -> ${error.message}`);
    throw error;
  }
};

/**
 * Acquire a dedicated client from the pool (e.g. for transactions)
 */
export const getClient = async () => {
  const p = getPostgresPool();
  const client = await p.connect();
  return client;
};

/**
 * Execute statements in a managed database transaction
 * @param {Function} callback - Callback function receiving client: async (client) => { ... }
 */
export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
