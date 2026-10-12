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

  static async sendTestMessage(req, res, next) {
    try {
      const result = await ChannelService.sendTestMessage(req.clientId, req.params.id, req.body);
      return successResponse(res, result, 'Test message dispatched');
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessProfile(req, res, next) {
    try {
      const profile = await ChannelService.updateBusinessProfile(req.clientId, req.params.id, req.body);
      return successResponse(res, profile, 'Business profile updated');
    } catch (error) {
      next(error);
    }
  }

  static async requestDisplayName(req, res, next) {
    try {
      const result = await ChannelService.requestDisplayNameChange(req.clientId, req.params.id, req.body);
      return successResponse(res, result, 'Display name change submitted');
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

  static async resubscribeWebhooks(req, res, next) {
    try {
      const result = await ChannelService.resubscribeWebhooks(req.clientId, req.params.id);
      return successResponse(res, result, 'Webhooks re-subscribed');
    } catch (error) {
      next(error);
    }
  }
}
