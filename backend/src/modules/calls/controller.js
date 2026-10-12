import { CallService } from './service.js';

export class CallController {
  static async listCalls(req, res, next) {
    try {
      const calls = await CallService.listCalls(req.user.clientId, req.query);
      res.status(200).json({
        success: true,
        data: calls,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCall(req, res, next) {
    try {
      const call = await CallService.getCall(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: call,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createTestCall(req, res, next) {
    try {
      const call = await CallService.createTestCall(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: call,
      });
    } catch (err) {
      next(err);
    }
  }
}
