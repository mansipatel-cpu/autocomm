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
      `UPDATE email_templates SET html_body = body_html WHERE html_body IS NULL AND body_html IS NOT NULL;`,
      `CREATE TABLE IF NOT EXISTS auth_otps (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          otp VARCHAR(64) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS groups JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS channel_id INT;`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS wa_id VARCHAR(64);`,
      `CREATE TABLE IF NOT EXISTS incoming_connections (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(64) NOT NULL DEFAULT 'Twilio',
          client_id INT REFERENCES clients(id) ON DELETE SET NULL,
          phone_number VARCHAR(64) DEFAULT '',
          webhook_url TEXT DEFAULT '',
          status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
          last_activity_at TIMESTAMPTZ DEFAULT NOW(),
          logs JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_incoming_connections_client_id ON incoming_connections(client_id);`,
      `CREATE INDEX IF NOT EXISTS idx_incoming_connections_status ON incoming_connections(status);`,
      `ALTER TABLE incoming_connections ADD COLUMN IF NOT EXISTS agent_id INT;`,
      `ALTER TABLE incoming_connections ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255);`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS type VARCHAR(64) DEFAULT 'incoming';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_tone VARCHAR(128) DEFAULT 'professional';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS personality VARCHAR(128) DEFAULT 'helpful';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_model VARCHAR(128) DEFAULT 'gpt-4o-mini';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS telephony_provider VARCHAR(64) DEFAULT 'twilio';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS eleven_labs_voice_id VARCHAR(128) DEFAULT '';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_stability NUMERIC(4, 2) DEFAULT 0.55;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_similarity_boost NUMERIC(4, 2) DEFAULT 0.85;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_speed NUMERIC(4, 2) DEFAULT 1.00;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS openai_voice VARCHAR(64) DEFAULT 'alloy';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS transfer_enabled BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS transfer_phone_number VARCHAR(64) DEFAULT '';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS detect_language_enabled BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS end_conversation_enabled BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS appointment_booking_enabled BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS flow_id VARCHAR(128) DEFAULT '';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base_ids JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS temperature NUMERIC(3, 2) DEFAULT 0.70;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS first_message TEXT DEFAULT 'Hello! How can I help you today?';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT '';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS language VARCHAR(32) DEFAULT 'en';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS greeting_message TEXT DEFAULT '';`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS call_settings JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`,
      `ALTER TABLE templates ADD COLUMN IF NOT EXISTS voice_tone VARCHAR(128) DEFAULT 'Professional';`,
      `ALTER TABLE templates ADD COLUMN IF NOT EXISTS personality VARCHAR(128) DEFAULT 'Support Specialist';`,
      `ALTER TABLE templates ADD COLUMN IF NOT EXISTS synthesis_language VARCHAR(64) DEFAULT 'English (US) - Neutral';`
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
