import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectPostgres, disconnectPostgres } from './config/postgres.js';
import { setIO } from './socket.js';
import { startCampaignScheduler } from './workers/campaign.scheduler.js';

// AutoComm Server - Client Users Management Updated
const startServer = async () => {
  await connectPostgres();

  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO with CORS
  const io = new SocketIOServer(server, {
    cors: {
      origin: [env.APP_URL, env.SUPERADMIN_URL, 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
  });

  setIO(io);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join tenant room
    socket.on('join:tenant', (clientId) => {
      if (clientId) {
        socket.join(`tenant:${clientId}`);
        logger.debug(`Socket ${socket.id} joined room tenant:${clientId}`);
      }
    });

    // Join conversation room
    socket.on('join:conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        logger.debug(`Socket ${socket.id} joined conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Attach io instance to app for controller access
  app.set('io', io);

  server.listen(env.PORT, () => {
    logger.info(`🚀 AutoComm API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`👉 Client API: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`👉 Super Admin API: http://localhost:${env.PORT}${env.API_PREFIX}/superadmin`);
    logger.info(`👉 Health check: http://localhost:${env.PORT}/health`);

    // Start background campaign scheduler for automatic scheduled delivery
    startCampaignScheduler();
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectPostgres();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
