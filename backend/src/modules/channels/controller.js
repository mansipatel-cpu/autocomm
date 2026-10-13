import { ChannelService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class ChannelController {
  static async list(req, res, next) {
    try {
      const channels = await ChannelService.listChannels(req.clientId);
      return successResponse(res, channels, 'Channels retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async listByUser(req, res, next) {
    try {
      const result = await ChannelService.listChannelsByUser(req.clientId, req.body?.userId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getActive(req, res, next) {
    try {
      const channel = await ChannelService.getActiveChannel(req.clientId);
      return res.status(200).json(channel);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const channel = await ChannelService.getChannelById(req.clientId, req.params.id);
      return successResponse(res, channel, 'Channel retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const channel = await ChannelService.createChannel(req.clientId, req.body);
      return createdResponse(res, channel, 'Channel connected successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const channel = await ChannelService.updateChannel(req.clientId, req.params.id, req.body);
      return successResponse(res, channel, 'Channel updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async sendTestMessage(req, res, next) {
    try {
      const result = await ChannelService.sendTestMessage(req.clientId, req.params.id, req.body);
      return successResponse(res, result, 'Test message dispatched');
    } catch (error) {
      next(error);
    }
  }

  static async disconnect(req, res, next) {
    try {
      const result = await ChannelService.disconnectChannel(req.clientId, req.params.id);
      return successResponse(res, result, 'Channel disconnected');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await ChannelService.deleteChannel(req.clientId, req.params.id);
      return successResponse(res, result, 'Channel deleted');
    } catch (error) {
      next(error);
    }
  }

  static async getWebhookSubscription(req, res, next) {
    try {
      const result = await ChannelService.checkWebhookSubscription(req.clientId, req.params.id);
      // Return 502 for unknown/error states (mirrors omnichannel-saas behaviour so the
      // frontend treats them as "unknown" instead of "not_subscribed")
      if (result.status === 'unknown') {
        return res.status(502).json(result);
      }
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resubscribeWebhook(req, res, next) {
    try {
      const result = await ChannelService.resubscribeWebhook(req.clientId, req.params.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async resubscribeAllWebhooks(req, res, next) {
    try {
      const result = await ChannelService.resubscribeAllWebhooks(req.clientId);
      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async checkChannelHealth(req, res, next) {
    try {
      const result = await ChannelService.checkChannelHealth(req.clientId, req.params.id);
      return successResponse(res, result, 'Health check completed');
    } catch (error) {
      next(error);
    }
  }
}
