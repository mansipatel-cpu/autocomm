import crypto from 'crypto';
import { Campaign, CampaignRecipient } from './model.js';
import { Contact } from '../contacts/model.js';
import { GroupMember } from '../groups/model.js';
import { AppError } from '../../common/errors/app-error.js';
import { CAMPAIGN_STATUS, CHANNEL_TYPES } from '../../config/constants.js';
import { enqueueCampaignDispatch } from '../../queues/campaign.queue.js';

export class CampaignService {
  static async listCampaigns({ clientId, channelType, status, search, page = 1, limit = 10 }) {
    const filter = {
      clientId,
      isDeleted: false,
    };

    if (channelType && channelType !== 'all') {
      filter.channelType = channelType;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Campaign.countDocuments(filter),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async listDeletedCampaigns({ clientId, search, page = 1, limit = 10 }) {
    const filter = {
      clientId,
      isDeleted: true,
    };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
      Campaign.countDocuments(filter),
    ]);

    // Calculate auto-purge countdown: 30 days minus elapsed days
    const enriched = campaigns.map((c) => {
      const deletedDate = new Date(c.deletedAt || c.updatedAt);
      const now = new Date();
      const diffDays = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - diffDays);

      return {
        ...c,
        purgeCountdown: `Auto-purges in ${daysRemaining}d`,
        deletedTimeAgo: `${diffDays === 0 ? 'Today' : `${diffDays} days ago`}`,
      };
    });

    return {
      campaigns: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getCampaignStats(clientId) {
    const [whatsappCount, voiceCount, deletedCount] = await Promise.all([
      Campaign.countDocuments({ clientId, isDeleted: false, channelType: CHANNEL_TYPES.WHATSAPP }),
      Campaign.countDocuments({ clientId, isDeleted: false, channelType: CHANNEL_TYPES.VOICE }),
      Campaign.countDocuments({ clientId, isDeleted: true }),
    ]);

    return {
      whatsappCount,
      voiceCount,
      deletedCount,
      activeDispatchRuns: 2,
    };
  }

  static async createWhatsAppCampaign(clientId, data, userId, userName) {
    const name = data.name;
    const description = data.description || '';
    const templateId = data.templateId;
    const templateName = data.templateName;
    const scheduleAt = data.scheduleAt || data.scheduledAt;
    const enableAutoRetry = data.enableAutoRetry ?? data.autoRetry;
    const groupIds = data.groupIds;
    const contactIds = data.contactIds || (Array.isArray(data.contactGroups) ? data.contactGroups : []);

    if (!name) {
      throw AppError.badRequest('Campaign name is required');
    }

    const campaignCode = `CMP-${Math.floor(1000 + Math.random() * 9000)}-WA`;

    const parsedTemplateId = templateId && !isNaN(parseInt(templateId, 10)) ? parseInt(templateId, 10) : null;

    const isFutureSchedule = Boolean(scheduleAt && new Date(scheduleAt).getTime() > Date.now());

    const campaign = await Campaign.create({
      clientId,
      name,
      campaignCode,
      channelType: CHANNEL_TYPES.WHATSAPP,
      campaignType: 'Marketing',
      description: description || '',
      templateId: parsedTemplateId,
      templateName: templateName || 'WhatsApp Official Template',
      enableAutoRetry: !!enableAutoRetry,
      scheduledAt: scheduleAt ? new Date(scheduleAt) : null,
      status: isFutureSchedule ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.ONGOING,
    });

    // Populate recipients from group or contact list
    let targetContacts = [];
    if (contactIds && contactIds.length > 0) {
      targetContacts = await Contact.find({ _id: { $in: contactIds }, clientId }).lean();
    } else if (groupIds && groupIds.length > 0) {
      const members = await GroupMember.find({ groupId: { $in: groupIds }, clientId }).lean();
      const cIds = members.map((m) => m.contactId);
      targetContacts = await Contact.find({ _id: { $in: cIds }, clientId }).lean();
    }

    if (targetContacts.length > 0) {
      try {
        const recipientDocs = targetContacts.map((c) => ({
          clientId,
          campaignId: campaign._id || campaign.id,
          name: c.name || 'Recipient',
          phoneNumber: (c.phoneNumber || c.phone || c.phone_number || '').trim() || '0000000000',
          email: c.email || '',
          status: 'pending',
        }));

        await CampaignRecipient.insertMany(recipientDocs);
        let metrics = campaign.metrics;
        if (typeof metrics === 'string') {
          try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
        }
        metrics = metrics || {};
        metrics.totalRecipients = recipientDocs.length;
        campaign.metrics = metrics;
        await campaign.save();
      } catch (recipientErr) {
        logger.error('[createWhatsAppCampaign recipient save error]:', recipientErr.message);
      }
    }

    // If immediate, dispatch immediately; if scheduled in future, campaign.scheduler will trigger at scheduled time
    if (!isFutureSchedule) {
      enqueueCampaignDispatch(campaign._id || campaign.id, clientId).catch((e) => {
        logger.error('[enqueueCampaignDispatch error]:', e?.message || e);
      });
    }

    return campaign;
  }

  static async createAutoCallingCampaign(clientId, data, userId, userName) {
    const {
      name,
      campaignType,
      campaignGoal,
      agentId,
      agentName,
      phoneNumber,
      visualFlowName,
      customScript,
      callScheduling,
      csvContacts,
    } = data;

    if (!name) throw AppError.badRequest('Campaign name is required');

    const campaignCode = `CMP-${Math.floor(1000 + Math.random() * 9000)}-VC`;

    const campaign = await Campaign.create({
      clientId,
      name,
      campaignCode,
      channelType: CHANNEL_TYPES.VOICE,
      campaignType: campaignType || 'Lead Qualification',
      campaignGoal: campaignGoal || '',
      agentId,
      agentName: agentName || 'Maya - Conversational Lead Qualifier',
      phoneNumber: phoneNumber || '+1 (800) 459-2311',
      visualFlowName: visualFlowName || '',
      customScript: customScript || '',
      callScheduling: callScheduling || { enabled: false },
      status: CAMPAIGN_STATUS.DRAFT,
    });

    if (csvContacts && csvContacts.length > 0) {
      const recipientDocs = csvContacts.map((c) => ({
        clientId,
        campaignId: campaign._id,
        name: c.name || 'Recipient',
        phoneNumber: c.phone_number || c.phone,
        email: c.email || '',
        language: c.language || 'en',
        city: c.city || '',
        customVariables: c,
        status: 'pending',
      }));

      await CampaignRecipient.insertMany(recipientDocs);
      let metrics = campaign.metrics;
      if (typeof metrics === 'string') {
        try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
      }
      metrics = metrics || {};
      metrics.totalRecipients = recipientDocs.length;
      campaign.metrics = metrics;
      campaign.status = CAMPAIGN_STATUS.ONGOING;
      await campaign.save();

      enqueueCampaignDispatch(campaign._id || campaign.id, clientId).catch((e) => {
        logger.error('[enqueueCampaignDispatch error]:', e?.message || e);
      });
    }

    return campaign;
  }

  static async getCampaignDetails(clientId, campaignId) {
    const numericId = !isNaN(campaignId) ? parseInt(campaignId, 10) : campaignId;
    let campaign = null;
    if (clientId) {
      campaign = await Campaign.findOne({ _id: numericId, clientId }).lean();
    }
    if (!campaign) {
      campaign = await Campaign.findOne({ _id: numericId }).lean();
    }
    if (!campaign) throw AppError.notFound('Campaign not found');

    let metrics = campaign.metrics;
    if (typeof metrics === 'string') {
      try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
    }
    metrics = metrics || {};

    const rawRecipients = await CampaignRecipient.find({
      campaignId: numericId,
    }).limit(200).lean();

    const recipients = (rawRecipients || []).map((r) => ({
      ...r,
      id: r.id || r._id,
      name: r.name || 'Recipient',
      phone: r.phoneNumber || r.phone || r.phone_number || '',
      status: r.status || 'pending',
      errorMessage: r.errorDetails || r.error_details || r.errorMessage || r.error_message || '',
      errorDetails: r.errorDetails || r.error_details || r.errorMessage || r.error_message || '',
    }));

    const totalRecipients = metrics.totalRecipients || recipients.length || 0;
    const sentCount = metrics.sent ?? metrics.sentCount ?? (['completed', 'active', 'sending', 'ongoing'].includes(campaign.status) ? totalRecipients : 0);
    const deliveredCount = metrics.delivered ?? metrics.deliveredCount ?? sentCount;
    const readCount = metrics.read ?? metrics.readCount ?? 0;
    const failedCount = metrics.failed ?? metrics.failedCount ?? 0;

    const normalizedCampaign = {
      ...campaign,
      id: campaign.id || campaign._id || numericId,
      _id: campaign._id || campaign.id || numericId,
      name: campaign.name || 'WhatsApp Campaign',
      type: campaign.channelType || 'whatsapp',
      channelType: campaign.channelType || 'whatsapp',
      apiType: campaign.apiType || 'Cloud API',
      campaignType: campaign.campaignType || 'Marketing',
      templateName: campaign.templateName || '',
      templateLanguage: campaign.language || campaign.templateLanguage || 'en_US',
      status: campaign.status || 'completed',
      metrics,
      recipientCount: totalRecipients,
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
    };

    return {
      campaign: normalizedCampaign,
      recipients,
    };
  }

  static async addContactsCsv(clientId, campaignId, contactsList) {
    const campaign = await Campaign.findOne({ _id: campaignId, clientId });
    if (!campaign) throw AppError.notFound('Campaign not found');

    const recipientDocs = contactsList.map((c) => ({
      clientId,
      campaignId: campaign._id,
      name: c.name || 'Recipient',
      phoneNumber: c.phone_number || c.phone,
      email: c.email || '',
      language: c.language || 'en',
      city: c.city || '',
      customVariables: c,
      status: 'pending',
    }));

    await CampaignRecipient.insertMany(recipientDocs);
    let metrics = campaign.metrics;
    if (typeof metrics === 'string') {
      try { metrics = JSON.parse(metrics); } catch { metrics = {}; }
    }
    metrics = metrics || {};
    metrics.totalRecipients = (metrics.totalRecipients || 0) + recipientDocs.length;
    campaign.metrics = metrics;
    await campaign.save();

    enqueueCampaignDispatch(campaign._id || campaign.id, clientId).catch((e) => {
      logger.error('[enqueueCampaignDispatch error]:', e?.message || e);
    });

    return { success: true, addedCount: recipientDocs.length };
  }

  static async softDeleteCampaign(clientId, campaignId, userId, userName) {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, clientId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deletedByUserName: userName || 'Admin User',
        },
      },
      { new: true }
    );
    if (!campaign) throw AppError.notFound('Campaign not found');
    return { success: true, message: 'Campaign moved to Deleted Campaigns (Auto-purged after 30 days)' };
  }

  static async restoreCampaign(clientId, campaignId) {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, clientId },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      { new: true }
    );
    if (!campaign) throw AppError.notFound('Campaign not found');
    return {
      success: true,
      message: 'Campaign Restored - The campaign has been reactivated with templates and contacts intact.',
    };
  }
}
