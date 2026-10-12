import { FlowBuilderService } from './service.js';

export class FlowBuilderController {
  static async listFlows(req, res, next) {
    try {
      const flows = await FlowBuilderService.listFlows(req.query);
      res.status(200).json({
        success: true,
        data: flows,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFlow(req, res, next) {
    try {
      const flow = await FlowBuilderService.getFlow(req.params.id);
      res.status(200).json({
        success: true,
        data: flow,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createFlow(req, res, next) {
    try {
      const flow = await FlowBuilderService.createFlow(req.body);
      res.status(201).json({
        success: true,
        data: flow,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateFlow(req, res, next) {
    try {
      const flow = await FlowBuilderService.updateFlow(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: flow,
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignToClient(req, res, next) {
    try {
      const flow = await FlowBuilderService.assignToClient(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: flow,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteFlow(req, res, next) {
    try {
      await FlowBuilderService.deleteFlow(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Flow deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
