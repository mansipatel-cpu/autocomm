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
    logger.error(`[PG Query Error] ${text} | Params: ${JSON.stringify(params)}:`, error.message);
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
