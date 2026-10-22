import { Router } from 'express';
import { Agent } from '../agents/model.js';
import { PhoneNumber } from '../phone-numbers/model.js';
import { Campaign } from '../campaigns/model.js';

const router = Router();

router.get('/limits', async (req, res) => {
  try {
    let clientId = req.clientId || req.user?.clientId;
    let counts = { knowledgeBases: 0, agents: 0, phoneNumbers: 0, campaigns: 0, widgets: 0 };

    if (clientId) {
      try {
        const [agentCount, phoneCount, campaignCount] = await Promise.all([
          Agent.countDocuments({ clientId }).catch(() => 0),
          PhoneNumber.countDocuments({ clientId }).catch(() => 0),
          Campaign.countDocuments({ clientId }).catch(() => 0),
        ]);
        counts.agents = agentCount || 0;
        counts.phoneNumbers = phoneCount || 0;
        counts.campaigns = campaignCount || 0;
      } catch (_e) {
        // Safe fallback
      }
    }

    res.json({
      success: true,
      knowledgeBases: {
        max: 100,
        used: counts.knowledgeBases,
        remaining: Math.max(0, 100 - counts.knowledgeBases),
      },
      maxKnowledgeBases: 100,
      agents: {
        max: 50,
        used: counts.agents,
        remaining: Math.max(0, 50 - counts.agents),
      },
      maxAgents: 50,
      phoneNumbers: {
        max: 50,
        used: counts.phoneNumbers,
        remaining: Math.max(0, 50 - counts.phoneNumbers),
      },
      maxPhoneNumbers: 50,
      campaigns: {
        max: 100,
        used: counts.campaigns,
        remaining: Math.max(0, 100 - counts.campaigns),
      },
      widgets: {
        max: 100,
        used: counts.widgets,
        remaining: Math.max(0, 100 - counts.widgets),
      },
      maxWidgets: 100,
      storage: {
        maxMb: 1024,
        usedMb: 5,
        remainingMb: 1019,
      },
      remaining: 100,
    });
  } catch (_err) {
    res.json({
      knowledgeBases: { max: 100, used: 0, remaining: 100 },
      maxKnowledgeBases: 100,
      maxWidgets: 100,
      remaining: 100,
    });
  }
});

router.get('/sip-phone-numbers', async (_req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

export default router;
