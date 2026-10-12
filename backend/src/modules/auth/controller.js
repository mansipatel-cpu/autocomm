import { AuthService } from './service.js';
import { successResponse } from '../../common/utils/response.util.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);

      // Set HttpOnly refresh token cookie for browser compatibility
      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: '/',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 3600,
        user: result.user,
        data: {
          token: result.accessToken,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: 3600,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const refreshToken =
        req.cookies?.refresh_token ||
        req.cookies?.refreshToken ||
        req.body?.refreshToken ||
        req.body?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token is required',
          message: 'Refresh token is required',
        });
      }

      const result = await AuthService.refresh(refreshToken);
      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        token: result.accessToken,
        accessToken: result.accessToken,
        expiresIn: 3600,
        data: {
          token: result.accessToken,
          accessToken: result.accessToken,
          expiresIn: 3600,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async changePassword(req, res, next) {
    try {
      const result = await AuthService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      return successResponse(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const result = await AuthService.getMe(req.user.id);
      const u = result.user.toObject ? result.user.toObject() : result.user;
      return res.status(200).json({
        ...u,
        id: u._id || u.id,
        user: u,
        client: result.client,
        data: {
          user: u,
          client: result.client,
        },
        success: true,
        message: 'Profile retrieved',
      });
    } catch (error) {
      next(error);
    }
  }
}
