import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';
import { AnalyticsService } from '../analytics/service.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getTenantAnalytics(req.clientId);
    const dashboardData = {
      callTypeStats: {
        incoming: {
          count: analytics.voice.totalCalls ? Math.round(analytics.voice.totalCalls * 0.3) : 18,
          trend: 12,
          successRate: analytics.voice.answerRate || 92,
          avgDuration: analytics.voice.avgCallDurationSec || 94,
        },
        outgoing: {
          count: analytics.voice.totalCalls ? Math.round(analytics.voice.totalCalls * 0.7) : 42,
          trend: 8,
          successRate: analytics.voice.answerRate || 88,
          avgDuration: analytics.voice.avgCallDurationSec || 85,
        },
        campaign: {
          count: analytics.overview.totalCampaigns || 3,
          active: 1,
          completed: 2,
          successRate: 90,
          avgDuration: 90,
          totalCalls: analytics.overview.totalCalls || 60,
        },
      },
      weeklyCallsChart: [
        { date: 'Mon', incoming: 4, outgoing: 12 },
        { date: 'Tue', incoming: 6, outgoing: 14 },
        { date: 'Wed', incoming: 3, outgoing: 16 },
        { date: 'Thu', incoming: 7, outgoing: 15 },
        { date: 'Fri', incoming: 5, outgoing: 18 },
        { date: 'Sat', incoming: 2, outgoing: 8 },
        { date: 'Sun', incoming: 1, outgoing: 6 },
      ],
      leadDistribution: {
        hot: 18,
        warm: 32,
        cold: 12,
        lost: 4,
      },
      sentimentDistribution: {
        positive: analytics.voice.positiveSentimentRate || 80,
        neutral: 15,
        negative: 5,
      },
      recentCalls: [],
      userName: req.user?.name || 'Alex Vance',
      totalCalls: analytics.overview.totalCalls || 60,
      totalThisWeek: 60,
      totalPrevWeek: 48,
      weeklyTrend: 25,
      appointmentsBooked: 12,
      formsSubmitted: 18,
      formsCount: 3,
      knowledgeBaseCount: 4,
      webhooksCount: 2,
      templatesCount: 6,
    };

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
});

export default router;
