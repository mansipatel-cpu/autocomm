import { AiSettingsService } from './service.js';

export class AiSettingsController {
  static async getSettings(req, res, next) {
    try {
      const settings = await AiSettingsService.getSettings(req.user.clientId);
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const settings = await AiSettingsService.updateSettings(req.user.clientId, req.body);
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  static async testChat(req, res, next) {
    try {
      const result = await AiSettingsService.testChat(req.user.clientId, req.body.message);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
