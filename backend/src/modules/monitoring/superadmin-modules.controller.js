import { SuperAdminModulesService } from './superadmin-modules.service.js';
import { AuditLogService } from '../audit-logs/service.js';
import { successResponse } from '../../common/utils/response.util.js';

export class SuperAdminModulesController {
  // Campaigns
  static async listCampaigns(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listCampaigns(req.query);
      return successResponse(res, result, 'Campaigns retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getCampaignDetails(req, res, next) {
    try {
      const result = await SuperAdminModulesService.getCampaignDetails(req.params.id);
      return successResponse(res, result, 'Campaign details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async toggleCampaignStatus(req, res, next) {
    try {
      const result = await SuperAdminModulesService.toggleCampaignStatus(req.params.id, req.body.status);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_CAMPAIGN_STATUS',
        resourceType: 'CAMPAIGN',
        resourceId: req.params.id,
        details: { status: result.status },
      });
      return successResponse(res, result, 'Campaign status updated');
    } catch (err) {
      next(err);
    }
  }

  // Channels
  static async listChannels(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listChannels(req.query);
      return successResponse(res, result, 'Channels retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async toggleChannelStatus(req, res, next) {
    try {
      const result = await SuperAdminModulesService.toggleChannelStatus(req.params.id);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_CHANNEL_STATUS',
        resourceType: 'CHANNEL',
        resourceId: req.params.id,
        details: { status: result.status },
      });
      return successResponse(res, result, 'Channel status toggled');
    } catch (err) {
      next(err);
    }
  }

  static async deleteChannel(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteChannel(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_CHANNEL',
        resourceType: 'CHANNEL',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Channel removed');
    } catch (err) {
      next(err);
    }
  }

  // Inbox
  static async listConversations(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listConversations(req.query);
      return successResponse(res, result, 'Conversations retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getConversationMessages(req, res, next) {
    try {
      const result = await SuperAdminModulesService.getConversationMessages(req.params.id);
      return successResponse(res, result, 'Messages retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async toggleConversationStatus(req, res, next) {
    try {
      const result = await SuperAdminModulesService.toggleConversationStatus(req.params.id, req.body.status);
      await AuditLogService.record({
        req,
        action: 'UPDATE_CONVERSATION_STATUS',
        resourceType: 'CONVERSATION',
        resourceId: req.params.id,
        details: { status: result.status },
      });
      return successResponse(res, result, 'Conversation status updated');
    } catch (err) {
      next(err);
    }
  }

  // Calls
  static async listCalls(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listCalls(req.query);
      return successResponse(res, result, 'Call records retrieved');
    } catch (err) {
      next(err);
    }
  }

  // Contacts & Groups
  static async listContacts(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listContacts(req.query);
      return successResponse(res, result, 'Contacts retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteContact(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteContact(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_CONTACT',
        resourceType: 'CONTACT',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Contact deleted');
    } catch (err) {
      next(err);
    }
  }

  static async listGroups(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listGroups(req.query);
      return successResponse(res, result, 'Contact groups retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteGroup(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteGroup(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_GROUP',
        resourceType: 'GROUP',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Group deleted');
    } catch (err) {
      next(err);
    }
  }

  // Templates
  static async listTemplates(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listTemplates(req.query);
      return successResponse(res, result, 'Templates retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async toggleTemplateStatus(req, res, next) {
    try {
      const result = await SuperAdminModulesService.toggleTemplateStatus(req.params.id);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_TEMPLATE_STATUS',
        resourceType: 'TEMPLATE',
        resourceId: req.params.id,
        details: { status: result.status },
      });
      return successResponse(res, result, 'Template status updated');
    } catch (err) {
      next(err);
    }
  }

  static async deleteTemplate(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteTemplate(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_TEMPLATE',
        resourceType: 'TEMPLATE',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Template deleted');
    } catch (err) {
      next(err);
    }
  }

  // AI Agents
  static async listAgents(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listAgents(req.query);
      return successResponse(res, result, 'AI Agents retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async toggleAgentStatus(req, res, next) {
    try {
      const result = await SuperAdminModulesService.toggleAgentStatus(req.params.id);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_AGENT_STATUS',
        resourceType: 'AGENT',
        resourceId: req.params.id,
        details: { status: result.status },
      });
      return successResponse(res, result, 'Agent status updated');
    } catch (err) {
      next(err);
    }
  }

  static async deleteAgent(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteAgent(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_AGENT',
        resourceType: 'AGENT',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Agent deleted');
    } catch (err) {
      next(err);
    }
  }

  // Knowledge Base
  static async listKnowledgeSources(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listKnowledgeSources(req.query);
      return successResponse(res, result, 'Knowledge sources retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteKnowledgeSource(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteKnowledgeSource(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_KNOWLEDGE_SOURCE',
        resourceType: 'KNOWLEDGE_SOURCE',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'Knowledge source deleted');
    } catch (err) {
      next(err);
    }
  }

  // Quick CRM
  static async listCrmLeads(req, res, next) {
    try {
      const result = await SuperAdminModulesService.listCrmLeads(req.query);
      return successResponse(res, result, 'CRM leads retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteCrmLead(req, res, next) {
    try {
      const result = await SuperAdminModulesService.deleteCrmLead(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_CRM_LEAD',
        resourceType: 'CRM_LEAD',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'CRM lead deleted');
    } catch (err) {
      next(err);
    }
  }
}
