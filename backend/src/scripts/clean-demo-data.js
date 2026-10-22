import { fileURLToPath } from 'url';
import { connectPostgres, disconnectPostgres, query } from '../config/postgres.js';
import { logger } from '../config/logger.js';
import { ROLES } from '../config/constants.js';

export const cleanDemoData = async () => {
  logger.info('🧹 Connecting to PostgreSQL to remove all demo and mock tenant data...');
  const connected = await connectPostgres();

  if (!connected) {
    logger.error('❌ Could not connect to PostgreSQL. Please check database configuration.');
    process.exit(1);
  }

  try {
    // 1. Delete all demo clients (e.g. CLI-1001, Capermint, or any non-superadmin client data)
    // Thanks to ON DELETE CASCADE, this cascades to users, channels, calls, contacts, etc.
    const deletedClients = await query(
      `DELETE FROM clients 
       WHERE client_code = 'CLI-1001' 
          OR company_name ILIKE '%capermint%' 
          OR admin_email = 'alex.vance@autocomm.io'
       RETURNING id, company_name, client_code`
    );

    logger.info(`✅ Removed ${deletedClients.rowCount} demo client(s):`, deletedClients.rows);

    // 2. Remove any orphaned demo users (excluding Super Admin)
    const deletedUsers = await query(
      `DELETE FROM users 
       WHERE (role != $1 AND client_id IS NULL)
          OR email = 'alex.vance@autocomm.io'
       RETURNING id, email, role`,
      [ROLES.SUPER_ADMIN]
    );

    logger.info(`✅ Removed ${deletedUsers.rowCount} orphaned/demo user(s):`, deletedUsers.rows);

    // 3. Remove mock call records
    const deletedCalls = await query(
      `DELETE FROM call_records 
       WHERE call_id = 'call_demo_9821a' 
          OR summary ILIKE '%Capermint%'
       RETURNING id, call_id`
    );
    logger.info(`✅ Removed ${deletedCalls.rowCount} mock call record(s)`);

    // 4. Remove mock CRM leads
    const deletedLeads = await query(
      `DELETE FROM crm_leads 
       WHERE email = 'michael.scott@dunder.com' 
          OR company ILIKE '%Dunder Mifflin%'
       RETURNING id, name, company`
    );
    logger.info(`✅ Removed ${deletedLeads.rowCount} mock CRM lead(s)`);

    logger.info('🎉 Successfully cleaned all mock and dummy data from the database!');
  } catch (error) {
    logger.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await disconnectPostgres();
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Clean process failed:', err);
      process.exit(1);
    });
}
