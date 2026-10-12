import { User } from '../users/model.js';
import { AppError } from '../../common/errors/app-error.js';
import { comparePassword } from '../../common/utils/crypto.util.js';
import { signSuperAdminToken } from '../../common/utils/jwt.util.js';
import { ROLES, USER_STATUS } from '../../config/constants.js';

export class SuperAdminAuthService {
  static async login({ username, password }) {
    const user = await User.findOne({
      role: ROLES.SUPER_ADMIN,
      $or: [
        { email: username.toLowerCase() },
        { name: username },
      ],
    });

    if (!user) {
      throw AppError.unauthorized('Authentication failed: Invalid Super Admin credentials.');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw AppError.forbidden('Super Admin account is disabled.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Authentication failed: Invalid Super Admin credentials.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signSuperAdminToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: ROLES.SUPER_ADMIN,
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user || user.role !== ROLES.SUPER_ADMIN) {
      throw AppError.notFound('Super Admin profile not found');
    }
    return user;
  }
}
