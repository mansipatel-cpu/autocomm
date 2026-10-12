import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './common/errors/error-handler.js';
import { AppError } from './common/errors/app-error.js';
import authRoutes from './modules/auth/routes.js';
import superAdminAuthRoutes from './modules/superadmin-auth/routes.js';
import clientRoutes from './modules/clients/routes.js';
import superAdminUserRoutes from './modules/users/superadmin-user.routes.js';
import emailTemplateRoutes from './modules/email-templates/routes.js';
import superAdminDashboardRoutes from './modules/dashboard/superadmin-dashboard.js';
import contactRoutes from './modules/contacts/routes.js';
import groupRoutes from './modules/groups/routes.js';
import templateRoutes from './modules/templates/routes.js';
import channelRoutes from './modules/channels/routes.js';
import campaignRoutes from './modules/campaigns/routes.js';
import inboxRoutes from './modules/team-inbox/routes.js';
import aiSettingsRoutes from './modules/ai-settings/routes.js';
import knowledgeBaseRoutes from './modules/knowledge-base/routes.js';
import whatsappWebhookRoutes from './webhooks/whatsapp.webhook.js';
import agentRoutes from './modules/agents/routes.js';
import voiceLibraryRoutes from './modules/voice-library/routes.js';
import phoneNumberRoutes from './modules/phone-numbers/routes.js';
import callRoutes from './modules/calls/routes.js';
import crmRoutes from './modules/crm/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import apiKeyRoutes from './modules/api-keys/routes.js';
import flowBuilderRoutes from './modules/flow-builder/routes.js';
import monitoringRoutes from './modules/monitoring/routes.js';

export const createApp = () => {
  const app = express();

  // Security & Core Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: [env.APP_URL, env.SUPERADMIN_URL, 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing middleware
  app.use((req, res, next) => {
    if (!req.cookies) {
      req.cookies = {};
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
          const parts = cookie.split('=');
          const name = parts[0]?.trim();
          if (name) {
            req.cookies[name] = decodeURIComponent(parts.slice(1).join('=').trim());
          }
        });
      }
    }
    next();
  });

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AutoComm Unified API',
      version: '1.0.0',
    });
  });

  // Client Core API Routes
  app.use('/api/auth', authRoutes);
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/campaigns`, campaignRoutes);
  app.use(`${env.API_PREFIX}/contacts`, contactRoutes);
  app.use(`${env.API_PREFIX}/groups`, groupRoutes);
  app.use(`${env.API_PREFIX}/templates`, templateRoutes);
  app.use(`${env.API_PREFIX}/channels`, channelRoutes);
  app.use(`${env.API_PREFIX}/inbox`, inboxRoutes);
  app.use(`${env.API_PREFIX}/ai-settings`, aiSettingsRoutes);
  app.use(`${env.API_PREFIX}/knowledge-base`, knowledgeBaseRoutes);
  app.use(`${env.API_PREFIX}/webhooks/whatsapp`, whatsappWebhookRoutes);
  app.use(`${env.API_PREFIX}/agents`, agentRoutes);
  app.use(`${env.API_PREFIX}/voice-library`, voiceLibraryRoutes);
  app.use(`${env.API_PREFIX}/phone-numbers`, phoneNumberRoutes);
  app.use(`${env.API_PREFIX}/calls`, callRoutes);
  app.use(`${env.API_PREFIX}/crm`, crmRoutes);
  app.use(`${env.API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${env.API_PREFIX}/api-keys`, apiKeyRoutes);

  // Super Admin API Routes
  app.use(`${env.API_PREFIX}/superadmin/auth`, superAdminAuthRoutes);
  app.use(`${env.API_PREFIX}/superadmin/clients`, clientRoutes);
  app.use(`${env.API_PREFIX}/superadmin/client-users`, superAdminUserRoutes);
  app.use(`${env.API_PREFIX}/superadmin/email-templates`, emailTemplateRoutes);
  app.use(`${env.API_PREFIX}/superadmin/dashboard`, superAdminDashboardRoutes);
  app.use(`${env.API_PREFIX}/superadmin/flows`, flowBuilderRoutes);
  app.use(`${env.API_PREFIX}/superadmin/monitoring`, monitoringRoutes);

  // 404 Not Found
  app.all('*', (req, res, next) => {
    next(AppError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
