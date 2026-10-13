import {
  connectPostgres,
  disconnectPostgres,
  getPostgresPool,
  pool,
  query,
  getClient,
  transaction,
} from './postgres.js';

export const connectDatabase = connectPostgres;
export const disconnectDatabase = disconnectPostgres;

export { getPostgresPool, pool, query, getClient, transaction };

