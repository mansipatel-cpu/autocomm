import { AgentService } from './service.js';

export class AgentController {
  static async listAgents(req, res, next) {
    try {
      const agents = await AgentService.listAgents(req.user.clientId, req.query);
      res.status(200).json({
        success: true,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAgent(req, res, next) {
    try {
      const agent = await AgentService.getAgent(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createAgent(req, res, next) {
    try {
      const agent = await AgentService.createAgent(req.user.clientId, req.body);
      res.status(201).json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAgent(req, res, next) {
    try {
      const agent = await AgentService.updateAgent(req.user.clientId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const agent = await AgentService.toggleStatus(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAgent(req, res, next) {
    try {
      await AgentService.deleteAgent(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Voice Agent deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
