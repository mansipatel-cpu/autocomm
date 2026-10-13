import { AiSettingsService } from './service.js';

export class AiSettingsController {
  static async getSettings(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const settings = await AiSettingsService.getSettings(clientId);
      if (req.originalUrl.includes('/whatsapp/ai-settings')) {
        return res.status(200).json(settings);
      }
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByChannel(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const settings = await AiSettingsService.getSettings(clientId);
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const settings = await AiSettingsService.updateSettings(clientId, req.body);
      if (req.originalUrl.includes('/whatsapp/ai-settings')) {
        return res.status(200).json(settings);
      }
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateById(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const settings = await AiSettingsService.updateSettings(clientId, req.body);
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const settings = await AiSettingsService.updateSettings(clientId, req.body);
      res.status(201).json(settings);
    } catch (err) {
      next(err);
    }
  }

  static async testChat(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId;
      const result = await AiSettingsService.testChat(clientId, req.body.message);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
