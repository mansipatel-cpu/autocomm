import { Router } from 'express';
import { MonitoringController } from './controller.js';
import { SuperAdminModulesController } from './superadmin-modules.controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

// Telemetry & Platform Overview
router.get('/metrics', MonitoringController.getSystemMetrics);
router.get('/reports', MonitoringController.getPlatformReports);
router.get('/reports/data', MonitoringController.getReportData);

// Campaigns (21.6)
router.get('/campaigns', SuperAdminModulesController.listCampaigns);
router.get('/campaigns/:id', SuperAdminModulesController.getCampaignDetails);
router.patch('/campaigns/:id/status', SuperAdminModulesController.toggleCampaignStatus);

// Channels & Integrations (21.9, 21.14)
router.get('/channels', SuperAdminModulesController.listChannels);
router.patch('/channels/:id/status', SuperAdminModulesController.toggleChannelStatus);
router.delete('/channels/:id', SuperAdminModulesController.deleteChannel);

// Team Inbox (21.13)
router.get('/inbox', SuperAdminModulesController.listConversations);
router.get('/inbox/:id/messages', SuperAdminModulesController.getConversationMessages);
router.patch('/inbox/:id/status', SuperAdminModulesController.toggleConversationStatus);

// Calls & Transcripts (21.18)
router.get('/calls', SuperAdminModulesController.listCalls);

// Contacts & Groups (21.8, 21.11, 21.12)
router.get('/contacts', SuperAdminModulesController.listContacts);
router.delete('/contacts/:id', SuperAdminModulesController.deleteContact);
router.get('/groups', SuperAdminModulesController.listGroups);
router.delete('/groups/:id', SuperAdminModulesController.deleteGroup);

// Templates (21.10)
router.get('/templates', SuperAdminModulesController.listTemplates);
router.patch('/templates/:id/status', SuperAdminModulesController.toggleTemplateStatus);
router.delete('/templates/:id', SuperAdminModulesController.deleteTemplate);

// AI Agents & Knowledge Base (21.15, 21.16)
router.get('/agents', SuperAdminModulesController.listAgents);
router.patch('/agents/:id/status', SuperAdminModulesController.toggleAgentStatus);
router.delete('/agents/:id', SuperAdminModulesController.deleteAgent);
router.get('/knowledge-base', SuperAdminModulesController.listKnowledgeSources);
router.delete('/knowledge-base/:id', SuperAdminModulesController.deleteKnowledgeSource);

// CRM (21.19)
router.get('/crm', SuperAdminModulesController.listCrmLeads);
router.delete('/crm/:id', SuperAdminModulesController.deleteCrmLead);

export default router;
