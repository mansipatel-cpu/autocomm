import { TeamInboxService } from './service.js';

export class TeamInboxController {
  static async listConversations(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const conversations = (await TeamInboxService.listConversations(clientId, req.query)) || [];
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json(conversations);
      }
      return res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json([]);
      }
      next(err);
    }
  }

  static async getConversation(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const conversation = await TeamInboxService.getConversation(clientId, req.params.id);
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json(conversation || {});
      }
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json({ id: req.params.id });
      }
      next(err);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const messages = (await TeamInboxService.getMessages(clientId, req.params.id)) || [];
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json(messages);
      }
      return res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (err) {
      if (req.originalUrl?.includes('/whatsapp/') || req.baseUrl?.includes('/whatsapp')) {
        return res.status(200).json([]);
      }
      next(err);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const text = req.body.text || req.body.content || req.body.message || '';
      const result = await TeamInboxService.sendMessage(clientId, req.params.id, {
        text,
        templateId: req.body.templateId,
        senderName: req.user?.name || req.body?.agentName || 'Agent',
      });
      return res.status(201).json({
        success: true,
        data: result,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const conversation = await TeamInboxService.markAsRead(clientId, req.params.id);
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const status = req.body.status || 'CLOSED';
      const conversation = await TeamInboxService.updateStatus(clientId, req.params.id, status);
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignAgent(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const conversation = await TeamInboxService.assignAgent(clientId, req.params.id, req.body.agentName);
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleBlock(req, res, next) {
    try {
      const clientId = req.clientId || req.user?.clientId || 1;
      const conversation = await TeamInboxService.toggleBlock(clientId, req.params.id);
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }
}
