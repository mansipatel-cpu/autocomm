import { TeamInboxService } from './service.js';

export class TeamInboxController {
  static async listConversations(req, res, next) {
    try {
      const conversations = await TeamInboxService.listConversations(req.user.clientId, req.query);
      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getConversation(req, res, next) {
    try {
      const conversation = await TeamInboxService.getConversation(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const messages = await TeamInboxService.getMessages(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (err) {
      next(err);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const result = await TeamInboxService.sendMessage(req.user.clientId, req.params.id, {
        text: req.body.text,
        templateId: req.body.templateId,
        senderName: req.user.name || 'Agent',
      });
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const conversation = await TeamInboxService.markAsRead(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const conversation = await TeamInboxService.updateStatus(req.user.clientId, req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignAgent(req, res, next) {
    try {
      const conversation = await TeamInboxService.assignAgent(req.user.clientId, req.params.id, req.body.assignedTo);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleBlock(req, res, next) {
    try {
      const conversation = await TeamInboxService.toggleBlock(req.user.clientId, req.params.id);
      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }
}
