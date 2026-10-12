import { MonitoringService } from './service.js';

export class MonitoringController {
  static async getSystemMetrics(req, res, next) {
    try {
      const data = await MonitoringService.getSystemMetrics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlatformReports(req, res, next) {
    try {
      const data = await MonitoringService.getPlatformReports();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
