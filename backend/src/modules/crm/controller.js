import { CrmService } from './service.js';

export class CrmController {
  static async getPipeline(req, res, next) {
    try {
      const data = await CrmService.getPipeline(req.user.clientId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createLead(req, res, next) {
    try {
      const lead = await CrmService.createLead(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLead(req, res, next) {
    try {
      const lead = await CrmService.updateLead(req.user.clientId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStage(req, res, next) {
    try {
      const lead = await CrmService.updateStage(req.user.clientId, req.params.id, req.body.stage);
      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLead(req, res, next) {
    try {
      await CrmService.deleteLead(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
