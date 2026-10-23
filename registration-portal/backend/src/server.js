import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import registrationRoutes from './routes/registration.routes.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

const app = express();

// Security & Cross-Origin Configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/health') {
    logger.debug(`${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'AutoComm Registration Portal Backend',
    port: config.port,
    isMockAutoComm: config.isMock,
    timestamp: new Date().toISOString(),
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

// Serve static frontend build if present
app.use(express.static(frontendDist));

// Mount API routes
app.use('/api', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Fallback to index.html for client-side routing on port 3000
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.resolve(frontendDist, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 Registration Portal Backend running on http://localhost:${config.port}`);
  console.log(`📡 AutoComm Mode: ${config.isMock ? '🟡 MOCK MODE (MOCK_AUTOCOMM=true)' : '🟢 LIVE MODE (Connecting to real AutoComm)'}`);
  console.log(`🔒 Admin Password Protection: ACTIVE`);
  console.log(`⚡ Rate Limiter: 120 req/min with 429 exponential backoff`);
  console.log('====================================================');
});

export default app;
