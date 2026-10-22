import { Router } from 'express';
import { Client } from '../clients/model.js';
import { User } from '../users/model.js';
import { Campaign } from '../campaigns/model.js';
import { Message } from '../team-inbox/model.js';
import { CallRecord } from '../calls/model.js';
import { Contact } from '../contacts/model.js';
import { Template } from '../templates/model.js';
import { Agent } from '../agents/model.js';
import { ConversationFlow } from '../flow-builder/model.js';
import { PhoneNumber } from '../phone-numbers/model.js';
import { CLIENT_STATUS, USER_STATUS, ROLES } from '../../config/constants.js';
import { successResponse } from '../../common/utils/response.util.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/metrics', async (req, res, next) => {
  try {
    const [
      totalClients,
      activeClients,
      inactiveClients,
      suspendedClients,
      totalClientUsers,
      activeUsers,
      totalCampaigns,
      activeCampaigns,
      totalMessages,
      totalCalls,
      totalContacts,
      totalTemplates,
      totalAiAgents,
      totalActiveFlows,
      totalPhoneNumbers,
    ] = await Promise.all([
      Client.countDocuments().catch(() => 0),
      Client.countDocuments({ status: CLIENT_STATUS.ACTIVE }).catch(() => 0),
      Client.countDocuments({ status: CLIENT_STATUS.INACTIVE }).catch(() => 0),
      Client.countDocuments({ status: CLIENT_STATUS.SUSPENDED }).catch(() => 0),
      User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN } }).catch(() => 0),
      User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN }, status: USER_STATUS.ACTIVE }).catch(() => 0),
      Campaign.countDocuments().catch(() => 0),
      Campaign.countDocuments({ status: 'ongoing' }).catch(() => 0),
      Message.countDocuments().catch(() => 0),
      CallRecord.countDocuments().catch(() => 0),
      Contact.countDocuments().catch(() => 0),
      Template.countDocuments().catch(() => 0),
      Agent.countDocuments().catch(() => 0),
      ConversationFlow.countDocuments().catch(() => 0),
      PhoneNumber.countDocuments().catch(() => 0),
    ]);

    // Compute platform-wide aggregations matching Section 21.2 15 cards
    const stats = {
      clients: {
        total: totalClients ?? 0,
        active: activeClients ?? 0,
        inactive: inactiveClients ?? 0,
        suspended: suspendedClients ?? 0,
      },
      users: {
        total: totalClientUsers ?? 0,
        active: activeUsers ?? 0,
      },
      campaigns: {
        total: totalCampaigns ?? 0,
        active: activeCampaigns ?? 0,
      },
      messages: {
        total: totalMessages ?? 0,
      },
      calls: {
        total: totalCalls ?? 0,
      },
      contacts: {
        total: totalContacts ?? 0,
      },
      templates: {
        total: totalTemplates ?? 0,
      },
      aiAgents: {
        total: totalAiAgents ?? 0,
      },
      activeFlows: {
        total: totalActiveFlows ?? 0,
      },
      phoneNumbers: {
        total: totalPhoneNumbers ?? 0,
      },
    };

    return successResponse(res, stats, 'Super Admin platform metrics retrieved');
  } catch (error) {
    next(error);
  }
});

export default router;
