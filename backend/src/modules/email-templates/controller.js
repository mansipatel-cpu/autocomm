import { EmailTemplateService } from './service.js';
import { successResponse } from '../../common/utils/response.util.js';

export class EmailTemplateController {
  static async list(req, res, next) {
    try {
      const templates = await EmailTemplateService.listTemplates();
      return successResponse(res, templates, 'Email templates retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const template = await EmailTemplateService.getTemplateById(req.params.id);
      return successResponse(res, template, 'Email template retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await EmailTemplateService.updateTemplate(req.params.id, req.body);
      return successResponse(res, updated, 'Email template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async testEmail(req, res, next) {
    try {
      const result = await EmailTemplateService.sendTestEmail(req.params.id, req.body.email);
      return successResponse(res, result, 'Test email dispatched');
    } catch (error) {
      next(error);
    }
  }
}
