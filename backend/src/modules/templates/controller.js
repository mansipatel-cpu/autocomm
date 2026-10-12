import { TemplateService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class TemplateController {
  static async list(req, res, next) {
    try {
      const { type, category, status, language, search, page, limit } = req.query;
      const result = await TemplateService.listTemplates({
        clientId: req.clientId,
        type,
        category,
        status,
        language,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Templates retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async stats(req, res, next) {
    try {
      const stats = await TemplateService.getTemplateStats(req.clientId);
      return successResponse(res, stats, 'Template stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createWhatway(req, res, next) {
    try {
      const template = await TemplateService.createWhatwayTemplate(req.clientId, req.body);
      return createdResponse(res, template, 'Whatway template submitted to Meta');
    } catch (error) {
      next(error);
    }
  }

  static async createVoice(req, res, next) {
    try {
      const template = await TemplateService.createAgentLabVoiceTemplate(req.clientId, req.body);
      return createdResponse(res, template, 'AgentLab voice template created');
    } catch (error) {
      next(error);
    }
  }

  static async syncMeta(req, res, next) {
    try {
      const result = await TemplateService.syncMeta(req.clientId);
      return successResponse(res, result, 'Templates synchronized with Meta API');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await TemplateService.deleteTemplate(req.clientId, req.params.id);
      return successResponse(res, result, 'Template removed');
    } catch (error) {
      next(error);
    }
  }
}
