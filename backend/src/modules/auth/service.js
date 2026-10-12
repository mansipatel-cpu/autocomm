import { User } from '../users/model.js';
import { Client } from '../clients/model.js';
import { AppError } from '../../common/errors/app-error.js';
import { comparePassword, hashPassword } from '../../common/utils/crypto.util.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.util.js';
import { USER_STATUS, CLIENT_STATUS } from '../../config/constants.js';

export class AuthService {
  static async login({ email, password, rememberMe }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw AppError.unauthorized('Authentication failed: Invalid username or password. Please try again.');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw AppError.forbidden('Your user account is inactive or pending activation.');
    }

    if (user.clientId) {
      const client = await Client.findById(user.clientId);
      if (!client || client.status !== CLIENT_STATUS.ACTIVE) {
        throw AppError.forbidden('Company account is suspended or inactive. Please contact your administrator.');
      }
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Authentication failed: Invalid username or password. Please try again.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId ? user.clientId.toString() : null,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  static async refresh(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw AppError.unauthorized('User not found or inactive');
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId ? user.clientId.toString() : null,
      mustChangePassword: user.mustChangePassword,
    };

    const newAccessToken = signAccessToken(payload);
    return { accessToken: newAccessToken };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw AppError.badRequest('Current password does not match.');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw AppError.notFound('User not found');
    }

    let client = null;
    if (user.clientId) {
      client = await Client.findById(user.clientId);
    }

    return { user, client };
  }
}
