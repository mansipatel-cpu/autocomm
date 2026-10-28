import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/postgres.js';
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
import sitesRoutes from './modules/channels/sites.routes.js';
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
import auditLogRoutes from './modules/audit-logs/routes.js';
import publicRoutes from './modules/public/routes.js';
import adminRoutes from './modules/admin/routes.js';
import clientDashboardRoutes from './modules/dashboard/client-dashboard.js';
import flowAutomationRoutes from './modules/flow-automation/routes.js';
import llmModelRoutes from './modules/llm-models/routes.js';
import { incomingConnectionRoutes, plivoIncomingRoutes, twilioOpenaiIncomingRoutes } from './modules/incoming-connections/routes.js';
import superAdminPhoneRoutes from './modules/phone-numbers/superadmin-phone.routes.js';
import superAdminIncomingRoutes from './modules/incoming-connections/superadmin-incoming.routes.js';

// Newly added compatibility and feature routers
import brandingRoutes from './modules/branding/routes.js';
import installerRoutes from './modules/installer/routes.js';
import demoModeRoutes from './modules/demo-mode/routes.js';
import pluginRoutes from './modules/plugins/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import whatsappCompatRoutes from './modules/whatsapp-compat/routes.js';
import voiceEngineRoutes from './modules/voice-engine/routes.js';
import outboundWebhookRoutes from './modules/webhooks/routes.js';
import integrationsRoutes from './modules/integrations/routes.js';
import teamAuthRoutes from './modules/team-auth/routes.js';
import subscriptionRoutes from './modules/subscriptions/routes.js';
import userRoutes from './modules/users/routes.js';

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
  app.get('/health', async (req, res) => {
    let pgStatus = 'disconnected';
    try {
      await pool.query('SELECT 1');
      pgStatus = 'connected';
    } catch {
      pgStatus = 'disconnected';
    }

    res.status(200).json({
      status: pgStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'AutoComm Unified API',
      version: '1.0.0',
      database: {
        postgres: pgStatus,
      },
    });
  });

  // Root and Health Endpoints
  app.get(['/', '/api', `${env.API_PREFIX}`], (req, res) => {
    res.json({
      success: true,
      service: 'AutoComm Unified API',
      version: '1.0.0',
      status: 'healthy',
    });
  });

  // 1. System, Installer & Branding Routes
  app.use(['/api/installer', `${env.API_PREFIX}/installer`], installerRoutes);
  app.use(['/api/branding', `${env.API_PREFIX}/branding`], brandingRoutes);
  app.use(['/api/admin/branding', `${env.API_PREFIX}/admin/branding`], brandingRoutes);
  app.use(['/api/demo-mode', `${env.API_PREFIX}/demo-mode`], demoModeRoutes);
  app.use(['/api/plugins', `${env.API_PREFIX}/plugins`], pluginRoutes);
  app.use(['/api/admin/plugins', `${env.API_PREFIX}/admin/plugins`], pluginRoutes);
  app.use(['/api/notifications', `${env.API_PREFIX}/notifications`], notificationRoutes);

  // 2. Auth Routes (Client, Team, Super Admin)
  app.use(['/api/auth', `${env.API_PREFIX}/auth`], authRoutes);
  app.use(['/api/user', `${env.API_PREFIX}/user`], userRoutes);
  app.use(['/api/team/auth', `${env.API_PREFIX}/team/auth`], teamAuthRoutes);
  app.use(['/api/admin/team/auth', `${env.API_PREFIX}/admin/team/auth`], teamAuthRoutes);

  // 3. Client Dashboard
  app.use(['/api/dashboard', `${env.API_PREFIX}/dashboard`], clientDashboardRoutes);

  // 4. Campaigns (Supports /campaigns, /whatsapp/campaigns, and /whatsapp/analytics/campaigns)
  app.use(['/api/campaigns', `${env.API_PREFIX}/campaigns`], campaignRoutes);
  app.use(['/api/whatsapp/campaigns', `${env.API_PREFIX}/whatsapp/campaigns`], campaignRoutes);
  app.use(['/api/whatsapp/analytics/campaigns', `${env.API_PREFIX}/whatsapp/analytics/campaigns`], campaignRoutes);

  // 5. Contacts & Groups
  app.use(['/api/contacts', `${env.API_PREFIX}/contacts`], contactRoutes);
  app.use(['/api/whatsapp/contacts', `${env.API_PREFIX}/whatsapp/contacts`], contactRoutes);
  app.use(['/api/groups', `${env.API_PREFIX}/groups`], groupRoutes);
  app.use(['/api/whatsapp/groups', `${env.API_PREFIX}/whatsapp/groups`], groupRoutes);

  // 6. Templates (Supports /templates and /whatsapp/templates with both prefixes)
  app.use(['/api/templates', `${env.API_PREFIX}/templates`], templateRoutes);
  app.use(['/api/whatsapp/templates', `${env.API_PREFIX}/whatsapp/templates`], templateRoutes);
  app.use(['/api/prompt-templates', `${env.API_PREFIX}/prompt-templates`], templateRoutes);

  // 7. Channels & Sites
  app.use(['/api/channels', `${env.API_PREFIX}/channels`], channelRoutes);
  app.use(['/api/whatsapp/channels', `${env.API_PREFIX}/whatsapp/channels`], channelRoutes);
  app.use(['/api/whatsapp', `${env.API_PREFIX}/whatsapp`], sitesRoutes);

  // 8. Inbox & WhatsApp Conversations
  app.use(['/api/inbox', `${env.API_PREFIX}/inbox`], inboxRoutes);
  app.use(['/api/whatsapp/conversations', `${env.API_PREFIX}/whatsapp/conversations`], inboxRoutes);

  // 9. AI Settings
  app.use(['/api/ai-settings', `${env.API_PREFIX}/ai-settings`], aiSettingsRoutes);
  app.use(['/api/whatsapp/ai-settings', `${env.API_PREFIX}/whatsapp/ai-settings`], aiSettingsRoutes);

  // 10. WhatsApp UI Compatibility Layer (tickets, team, chatbots, ecommerce, brand-settings)
  app.use(['/api/whatsapp', `${env.API_PREFIX}/whatsapp`], whatsappCompatRoutes);
  app.use(['/api/chatbots', `${env.API_PREFIX}/chatbots`], whatsappCompatRoutes);
  app.use(['/api/ecommerce', `${env.API_PREFIX}/ecommerce`], whatsappCompatRoutes);

  // 11. Voice Engine & Agents
  app.use(['/api/voice-engine', `${env.API_PREFIX}/voice-engine`], voiceEngineRoutes);
  app.use(['/api/agents', `${env.API_PREFIX}/agents`], agentRoutes);
  app.use(['/api/voice-library', `${env.API_PREFIX}/voice-library`], voiceLibraryRoutes);
  app.use(['/api/voices', `${env.API_PREFIX}/voices`], voiceLibraryRoutes);
  app.use(['/api/elevenlabs/voices', `${env.API_PREFIX}/elevenlabs/voices`], voiceLibraryRoutes);

  // 12. Phone Numbers & Calls
  app.use(['/api/phone-numbers', `${env.API_PREFIX}/phone-numbers`], phoneNumberRoutes);
  app.use(['/api/calls', `${env.API_PREFIX}/calls`], callRoutes);

  // 13. CRM & Analytics
  app.use(['/api/crm', `${env.API_PREFIX}/crm`], crmRoutes);
  app.use(['/api/analytics', `${env.API_PREFIX}/analytics`], analyticsRoutes);

  // 14. API Keys & Knowledge Base
  app.use(['/api/api-keys', `${env.API_PREFIX}/api-keys`], apiKeyRoutes);
  app.use(['/api/knowledge-base', `${env.API_PREFIX}/knowledge-base`], knowledgeBaseRoutes);
  app.use(['/api/rag-knowledge', `${env.API_PREFIX}/rag-knowledge`], knowledgeBaseRoutes);

  // 15. Flow Automation & LLM Models
  app.use(['/api/flow-automation', `${env.API_PREFIX}/flow-automation`], flowAutomationRoutes);
  app.use(['/api/llm-models', `${env.API_PREFIX}/llm-models`], llmModelRoutes);

  // 16. Outbound & Inbound Webhooks
  app.use(['/api/webhooks', `${env.API_PREFIX}/webhooks`], outboundWebhookRoutes);
  app.use(`${env.API_PREFIX}/webhooks/whatsapp`, whatsappWebhookRoutes);

  // 17. Incoming Telephony Connections
  app.use(['/api/incoming-connections', `${env.API_PREFIX}/incoming-connections`], incomingConnectionRoutes);
  app.use(['/api/plivo/incoming-connections', `${env.API_PREFIX}/plivo/incoming-connections`], plivoIncomingRoutes);
  app.use(['/api/twilio-openai/incoming-connections', `${env.API_PREFIX}/twilio-openai/incoming-connections`], twilioOpenaiIncomingRoutes);

  // 18. Integrations & Subscriptions
  app.use(['/api/integrations', `${env.API_PREFIX}/integrations`], integrationsRoutes);
  app.use(['/api/subscriptions', `${env.API_PREFIX}/subscriptions`], subscriptionRoutes);
  app.use(['/api/plans', `${env.API_PREFIX}/plans`], subscriptionRoutes);

  // 19. Public & Admin Settings
  app.use(['/api/settings', `${env.API_PREFIX}/settings`], publicRoutes);
  app.use(['/api/public', `${env.API_PREFIX}/public`], publicRoutes);
  app.use(['/api/admin', `${env.API_PREFIX}/admin`], adminRoutes);

  // 20. Super Admin API Routes
  app.use(`${env.API_PREFIX}/superadmin/auth`, superAdminAuthRoutes);
  app.use(`${env.API_PREFIX}/superadmin/clients`, clientRoutes);
  app.use(`${env.API_PREFIX}/superadmin/client-users`, superAdminUserRoutes);
  app.use(`${env.API_PREFIX}/superadmin/email-templates`, emailTemplateRoutes);
  app.use(`${env.API_PREFIX}/superadmin/dashboard`, superAdminDashboardRoutes);
  app.use(`${env.API_PREFIX}/superadmin/flows`, flowBuilderRoutes);
  app.use(`${env.API_PREFIX}/superadmin/monitoring`, monitoringRoutes);
  app.use(`${env.API_PREFIX}/superadmin/audit-logs`, auditLogRoutes);
  app.use(`${env.API_PREFIX}/superadmin/phone-numbers`, superAdminPhoneRoutes);
  app.use(`${env.API_PREFIX}/superadmin/incoming-connections`, superAdminIncomingRoutes);

  // 404 Catch-All Handler
  app.all('*', (req, res, next) => {
    next(AppError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};
