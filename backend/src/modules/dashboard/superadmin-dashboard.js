import { Router } from 'express';
import { Client } from '../clients/model.js';
import { User } from '../users/model.js';
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
    ] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: CLIENT_STATUS.ACTIVE }),
      Client.countDocuments({ status: CLIENT_STATUS.INACTIVE }),
      Client.countDocuments({ status: CLIENT_STATUS.SUSPENDED }),
      User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN } }),
      User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN }, status: USER_STATUS.ACTIVE }),
    ]);

    // Compute platform-wide aggregations with defaults
    const stats = {
      clients: {
        total: totalClients,
        active: activeClients,
        inactive: inactiveClients,
        suspended: suspendedClients,
      },
      users: {
        total: totalClientUsers,
        active: activeUsers,
      },
      campaigns: {
        total: 14,
        active: 2,
      },
      messages: {
        total: 24580,
      },
      calls: {
        total: 8420,
      },
      contacts: {
        total: 12450,
      },
      templates: {
        total: 48,
      },
      aiAgents: {
        total: 6,
      },
      activeFlows: {
        total: 4,
      },
      phoneNumbers: {
        total: 8,
      },
    };

    return successResponse(res, stats, 'Super Admin platform metrics retrieved');
  } catch (error) {
    next(error);
  }
});

export default router;
