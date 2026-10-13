import { AuditLog } from './model.js';
import { logger } from '../../config/logger.js';
import { ensureSchemaAlignment } from '../../config/postgres.js';

export class AuditLogService {
  /**
   * Record a Super Admin write action to the audit trail
   */
  static async record({ req, adminId, adminEmail, action, resourceType, resourceId = '', details = {} }) {
    try {
      await ensureSchemaAlignment().catch(() => {});
      const resolvedAdminId = adminId || req?.user?.id || null;
      const resolvedAdminEmail = adminEmail || req?.user?.email || '';
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';

      const logEntry = await AuditLog.create({
        adminId: resolvedAdminId ? String(resolvedAdminId) : null,
        adminEmail: resolvedAdminEmail,
        action,
        resourceType,
        resourceId: String(resourceId || ''),
        details,
        ipAddress: String(ipAddress),
      });

      return logEntry;
    } catch (err) {
      // Never let an audit logging failure crash the primary business operation
      logger.error('[AuditLogService.record error]:', err.message);
      return null;
    }
  }

  /**
   * List audit logs with search, filtering, and pagination
   */
  static async list({ search, action, resourceType, page = 1, limit = 20 }) {
    const filter = {};

    if (action && action !== 'all') {
      filter.action = action;
    }

    if (resourceType && resourceType !== 'all') {
      filter.resourceType = resourceType;
    }

    if (search) {
      filter.$or = [
        { adminEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resourceType: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs: logs || [],
      total: total || 0,
      page,
      limit,
      totalPages: Math.ceil((total || 0) / limit) || 1,
    };
  }
}
