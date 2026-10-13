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

  static async getReportData(req, res, next) {
    try {
      const { type = 'client', clientId, format = 'json' } = req.query;
      const report = await MonitoringService.generateReport(type, { clientId });

      if (format === 'csv') {
        const csvContent = MonitoringService.convertToCsv(report.headers, report.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
        return res.status(200).send(csvContent);
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}
