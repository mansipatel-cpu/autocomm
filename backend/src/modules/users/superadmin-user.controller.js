import { SuperAdminUserService } from './superadmin-user.service.js';
import { AuditLogService } from '../audit-logs/service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class SuperAdminUserController {
  static async list(req, res, next) {
    try {
      const { clientId, search, role, status, page, limit } = req.query;
      const result = await SuperAdminUserService.listUsers({
        clientId,
        search,
        role,
        status,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Client users retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const result = await SuperAdminUserService.createUser(req.body);
      await AuditLogService.record({
        req,
        action: 'CREATE_CLIENT_USER',
        resourceType: 'USER',
        resourceId: result.user?.id || result.user?._id,
        details: { email: result.user?.email, clientId: req.body.clientId, role: req.body.role },
      });
      return createdResponse(res, result, 'Client user added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await SuperAdminUserService.updateUser(req.params.id, req.body);
      await AuditLogService.record({
        req,
        action: 'UPDATE_CLIENT_USER',
        resourceType: 'USER',
        resourceId: req.params.id,
        details: req.body,
      });
      return successResponse(res, updated, 'Client user updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const updated = await SuperAdminUserService.toggleStatus(req.params.id);
      await AuditLogService.record({
        req,
        action: 'TOGGLE_USER_STATUS',
        resourceType: 'USER',
        resourceId: req.params.id,
        details: { status: updated.status },
      });
      return successResponse(res, updated, 'User status toggled');
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const result = await SuperAdminUserService.resetPassword(req.params.id);
      await AuditLogService.record({
        req,
        action: 'RESET_USER_PASSWORD',
        resourceType: 'USER',
        resourceId: req.params.id,
        details: { email: result.email },
      });
      return successResponse(res, result, 'User password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await SuperAdminUserService.deleteUser(req.params.id);
      await AuditLogService.record({
        req,
        action: 'DELETE_CLIENT_USER',
        resourceType: 'USER',
        resourceId: req.params.id,
      });
      return successResponse(res, result, 'User deleted');
    } catch (error) {
      next(error);
    }
  }
}
