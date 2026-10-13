import { EmailTemplateService } from './service.js';
import { AuditLogService } from '../audit-logs/service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class EmailTemplateController {
  static async list(req, res, next) {
    try {
      const templates = await EmailTemplateService.listTemplates();
      return successResponse(res, templates, 'Email templates retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const template = await EmailTemplateService.createTemplate(req.body);
      await AuditLogService.record({
        req,
        action: 'CREATE_EMAIL_TEMPLATE',
        resourceType: 'EMAIL_TEMPLATE',
        resourceId: template._id || template.id,
        details: { name: template.name, subject: template.subject },
      });
      return createdResponse(res, template, 'Email template created successfully');
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
      await AuditLogService.record({
        req,
        action: 'UPDATE_EMAIL_TEMPLATE',
        resourceType: 'EMAIL_TEMPLATE',
        resourceId: req.params.id,
        details: req.body,
      });
      return successResponse(res, updated, 'Email template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const updated = await EmailTemplateService.toggleStatus(req.params.id);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_EMAIL_TEMPLATE_STATUS',
        resourceType: 'EMAIL_TEMPLATE',
        resourceId: req.params.id,
        details: { isActive: updated.isActive },
      });
      return successResponse(res, updated, 'Template status updated');
    } catch (error) {
      next(error);
    }
  }

  static async preview(req, res, next) {
    try {
      const preview = await EmailTemplateService.previewTemplate(req.params.id, req.body?.variables || {});
      return successResponse(res, preview, 'Template preview generated');
    } catch (error) {
      next(error);
    }
  }

  static async testEmail(req, res, next) {
    try {
      const result = await EmailTemplateService.sendTestEmail(req.params.id, req.body.email);
      await AuditLogService.record({
        req,
        action: 'TEST_EMAIL_TEMPLATE',
        resourceType: 'EMAIL_TEMPLATE',
        resourceId: req.params.id,
        details: { recipientEmail: req.body.email },
      });
      return successResponse(res, result, 'Test email dispatched');
    } catch (error) {
      next(error);
    }
  }
}
