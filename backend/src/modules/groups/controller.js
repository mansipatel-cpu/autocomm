import { GroupService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

export class GroupController {
  static async list(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await GroupService.listGroups({
        clientId: req.clientId,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Groups retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const group = await GroupService.createGroup({
        clientId: req.clientId,
        ...req.body,
      });
      return createdResponse(res, group, 'Group created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await GroupService.getMembers(req.clientId, req.params.id, {
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });
      return successResponse(res, result, 'Group members retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await GroupService.deleteGroup(req.clientId, req.params.id);
      return successResponse(res, result, 'Group deleted');
    } catch (error) {
      next(error);
    }
  }
}
