import { SuperAdminAuthService } from './service.js';
import { successResponse } from '../../common/utils/response.util.js';

export class SuperAdminAuthController {
  static async login(req, res, next) {
    try {
      const result = await SuperAdminAuthService.login(req.body);
      return successResponse(res, result, 'Super Admin login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const result = await SuperAdminAuthService.getMe(req.user.id);
      return successResponse(res, result, 'Super Admin profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}
