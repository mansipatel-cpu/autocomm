import { Campaign } from '../campaigns/model.js';
import { Channel } from '../channels/model.js';
import { Conversation, Message } from '../team-inbox/model.js';
import { CallRecord } from '../calls/model.js';
import { Contact } from '../contacts/model.js';
import { Group } from '../groups/model.js';
import { Template } from '../templates/model.js';
import { Agent } from '../agents/model.js';
import { KnowledgeSource } from '../knowledge-base/model.js';
import { CrmLead } from '../crm/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class SuperAdminModulesService {
  // 1. Campaigns (21.6)
  static async listCampaigns({ search, clientId, status, type, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return { campaigns, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async getCampaignDetails(id) {
    const campaign = await Campaign.findById(id).populate('clientId', 'companyName clientCode').lean();
    if (!campaign) throw AppError.notFound('Campaign not found');
    return campaign;
  }

  static async toggleCampaignStatus(id, newStatus) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw AppError.notFound('Campaign not found');
    campaign.status = newStatus || (campaign.status === 'active' ? 'paused' : 'active');
    await campaign.save();
    return campaign;
  }

  // 2. Channels & Integrations (21.9, 21.14)
  static async listChannels({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      Channel.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Channel.countDocuments(filter),
    ]);

    return { channels, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async toggleChannelStatus(id) {
    const channel = await Channel.findById(id);
    if (!channel) throw AppError.notFound('Channel not found');
    channel.status = channel.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    await channel.save();
    return channel;
  }

  static async deleteChannel(id) {
    const channel = await Channel.findByIdAndDelete(id);
    if (!channel) throw AppError.notFound('Channel not found');
    return { success: true };
  }

  // 3. Team Inbox (21.13)
  static async listConversations({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { contactName: { $regex: search, $options: 'i' } },
        { contactPhoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return { conversations, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async getConversationMessages(conversationId) {
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();
    return messages;
  }

  static async toggleConversationStatus(id, newStatus) {
    const conv = await Conversation.findById(id);
    if (!conv) throw AppError.notFound('Conversation not found');
    conv.status = newStatus || (conv.status === 'OPEN' ? 'CLOSED' : 'OPEN');
    await conv.save();
    return conv;
  }

  // 4. Calls & Transcripts (21.18)
  static async listCalls({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { customerNumber: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [calls, total] = await Promise.all([
      CallRecord.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CallRecord.countDocuments(filter),
    ]);

    return { calls, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  // 5. Contacts & Groups (21.8, 21.11, 21.12)
  static async listContacts({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return { contacts, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async deleteContact(id) {
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) throw AppError.notFound('Contact not found');
    return { success: true };
  }

  static async listGroups({ clientId, page = 1, limit = 20 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;

    const skip = (page - 1) * limit;
    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Group.countDocuments(filter),
    ]);

    return { groups, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async deleteGroup(id) {
    const group = await Group.findByIdAndDelete(id);
    if (!group) throw AppError.notFound('Group not found');
    return { success: true };
  }

  // 6. Templates (21.10)
  static async listTemplates({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Template.countDocuments(filter),
    ]);

    return { templates, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async toggleTemplateStatus(id) {
    const tpl = await Template.findById(id);
    if (!tpl) throw AppError.notFound('Template not found');
    tpl.status = tpl.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    await tpl.save();
    return tpl;
  }

  static async deleteTemplate(id) {
    const tpl = await Template.findByIdAndDelete(id);
    if (!tpl) throw AppError.notFound('Template not found');
    return { success: true };
  }

  // 7. AI Agents & Knowledge Base (21.15, 21.16)
  static async listAgents({ search, clientId, status, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (status && status !== 'all') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [agents, total] = await Promise.all([
      Agent.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Agent.countDocuments(filter),
    ]);

    return { agents, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async toggleAgentStatus(id) {
    const agent = await Agent.findById(id);
    if (!agent) throw AppError.notFound('Agent not found');
    agent.status = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await agent.save();
    return agent;
  }

  static async deleteAgent(id) {
    const agent = await Agent.findByIdAndDelete(id);
    if (!agent) throw AppError.notFound('Agent not found');
    return { success: true };
  }

  static async listKnowledgeSources({ clientId, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;

    const skip = (page - 1) * limit;
    const [sources, total] = await Promise.all([
      KnowledgeSource.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KnowledgeSource.countDocuments(filter),
    ]);

    return { sources, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async deleteKnowledgeSource(id) {
    const src = await KnowledgeSource.findByIdAndDelete(id);
    if (!src) throw AppError.notFound('Knowledge source not found');
    return { success: true };
  }

  // 8. Quick CRM (21.19)
  static async listCrmLeads({ search, clientId, stage, page = 1, limit = 10 }) {
    const filter = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (stage && stage !== 'all') filter.stage = stage;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      CrmLead.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CrmLead.countDocuments(filter),
    ]);

    return { leads, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  static async deleteCrmLead(id) {
    const lead = await CrmLead.findByIdAndDelete(id);
    if (!lead) throw AppError.notFound('CRM lead not found');
    return { success: true };
  }
}
