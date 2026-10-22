import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDatabaseExists } from './init-db.js';
import { connectPostgres, disconnectPostgres, query } from '../config/postgres.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { hashPassword } from '../common/utils/crypto.util.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async () => {
  await ensureDatabaseExists();
  logger.info('🌱 Connecting to PostgreSQL to seed initial platform system data...');
  const connected = await connectPostgres();

  if (!connected) {
    logger.error('❌ Could not connect to PostgreSQL. Please check database configuration.');
    process.exit(1);
  }

  // 0. Ensure schema tables exist
  const sqlPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    const schemaSql = fs.readFileSync(sqlPath, 'utf8');
    await query(schemaSql);
  }

  try {
    // 1. Initial Super Admin Root User
    const superAdminCheck = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', [ROLES.SUPER_ADMIN]);

    if (superAdminCheck.rows.length === 0) {
      const superAdminPassword = await hashPassword('SuperAdmin@2026');
      await query(
        `INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [null, 'Root Operator', 'superadmin@autocomm.io', superAdminPassword, ROLES.SUPER_ADMIN, USER_STATUS.ACTIVE, false]
      );
      logger.info('✅ Initial Super Admin created: superadmin@autocomm.io / SuperAdmin@2026');
    } else {
      logger.info('ℹ️ Super Admin account already exists.');
    }

    logger.info('🎉 Platform database initialized without mock/dummy data.');
  } catch (error) {
    logger.error('❌ Error during PostgreSQL initialization:', error);
    process.exit(1);
  } finally {
    await disconnectPostgres();
  }
};

// Auto-run if invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Seed process failed:', err);
      process.exit(1);
    });
}
