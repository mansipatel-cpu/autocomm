import { SuperAdminUserService } from './superadmin-user.service.js';
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
      return createdResponse(res, result, 'Client user added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await SuperAdminUserService.updateUser(req.params.id, req.body);
      return successResponse(res, updated, 'Client user updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const updated = await SuperAdminUserService.toggleStatus(req.params.id);
      return successResponse(res, updated, 'User status toggled');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await SuperAdminUserService.deleteUser(req.params.id);
      return successResponse(res, result, 'User deleted');
    } catch (error) {
      next(error);
    }
  }
}
