import { AnalyticsService } from './service.js';

export class AnalyticsController {
  static async getTenantAnalytics(req, res, next) {
    try {
      const data = await AnalyticsService.getTenantAnalytics(req.user.clientId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
