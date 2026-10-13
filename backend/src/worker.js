import { connectPostgres, disconnectPostgres } from './config/postgres.js';
import { getRedisClient } from './config/redis.js';
import { logger } from './config/logger.js';

const startWorkers = async () => {
  await connectPostgres();
  getRedisClient();

  logger.info('⚙️  AutoComm BullMQ Workers Process initialized and listening for jobs...');

  // Worker queues will be loaded here as modules are developed
  const shutdown = async (signal) => {
    logger.info(`Worker received ${signal}. Stopping queues...`);
    await disconnectPostgres();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startWorkers().catch((err) => {
  logger.error('Failed to start worker process:', err);
  process.exit(1);
});
