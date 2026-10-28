import { CampaignService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class CampaignController {
  static async list(req, res, next) {
    try {
      const isWhatsApp = req.originalUrl.includes('/whatsapp/');
      const effectiveChannelType = req.query.channelType || (isWhatsApp ? 'whatsapp' : 'voice');
      const { status, search, page, limit } = req.query;

      const result = await CampaignService.listCampaigns({
        clientId: req.clientId,
        channelType: effectiveChannelType === 'all' ? undefined : effectiveChannelType,
        status,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '50', 10),
      });

      return res.status(200).json({
        success: true,
        data: result.campaigns,
        campaigns: result.campaigns,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDeleted(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await CampaignService.listDeletedCampaigns({
        clientId: req.clientId,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Deleted campaigns retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async stats(req, res, next) {
    try {
      const stats = await CampaignService.getCampaignStats(req.clientId);
      return successResponse(res, stats, 'Campaign statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createWhatsApp(req, res, next) {
    try {
      const campaign = await CampaignService.createWhatsAppCampaign(
        req.clientId,
        req.body,
        req.user?.id || req.user?._id || 1,
        req.user?.name || req.user?.username || req.user?.email || 'User'
      );
      return createdResponse(res, campaign, 'WhatsApp campaign created and dispatch queued');
    } catch (error) {
      next(error);
    }
  }

  static async createAutoCalling(req, res, next) {
    try {
      const campaign = await CampaignService.createAutoCallingCampaign(
        req.clientId,
        req.body,
        req.user?.id || req.user?._id || 1,
        req.user?.name || req.user?.username || req.user?.email || 'User'
      );
      return createdResponse(res, campaign, 'Auto Calling campaign created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req, res, next) {
    try {
      const details = await CampaignService.getCampaignDetails(req.clientId, req.params.id);
      return res.status(200).json({
        success: true,
        data: details,
        campaign: details.campaign,
        recipients: details.recipients,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addContactsCsv(req, res, next) {
    try {
      const result = await CampaignService.addContactsCsv(
        req.clientId,
        req.params.id,
        req.body.contacts || []
      );
      return successResponse(res, result, 'Recipients added from CSV');
    } catch (error) {
      next(error);
    }
  }

  static async softDelete(req, res, next) {
    try {
      const result = await CampaignService.softDeleteCampaign(
        req.clientId,
        req.params.id,
        req.user.id,
        req.user.name
      );
      return successResponse(res, result, 'Campaign moved to Deleted tab');
    } catch (error) {
      next(error);
    }
  }

  static async restore(req, res, next) {
    try {
      const result = await CampaignService.restoreCampaign(req.clientId, req.params.id);
      return successResponse(res, result, 'Campaign restored successfully');
    } catch (error) {
      next(error);
    }
  }
}
