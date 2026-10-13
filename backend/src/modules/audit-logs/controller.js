import { AuditLogService } from './service.js';
import { successResponse } from '../../common/utils/response.util.js';

export class AuditLogController {
  static async list(req, res, next) {
    try {
      const { search, action, resourceType, page, limit } = req.query;
      const result = await AuditLogService.list({
        search,
        action,
        resourceType,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return successResponse(res, result, 'Audit logs retrieved');
    } catch (error) {
      next(error);
    }
  }
}
