import { ApiKeyService } from './service.js';

export class ApiKeyController {
  static async listKeys(req, res, next) {
    try {
      const keys = await ApiKeyService.listKeys(req.user.clientId);
      res.status(200).json({
        success: true,
        data: keys,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createKey(req, res, next) {
    try {
      const result = await ApiKeyService.createKey(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async revokeKey(req, res, next) {
    try {
      const key = await ApiKeyService.revokeKey(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: key,
      });
    } catch (err) {
      next(err);
    }
  }
}
