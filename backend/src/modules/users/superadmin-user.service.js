import crypto from 'crypto';
import { User } from './model.js';
import { Client } from '../clients/model.js';
import { hashPassword } from '../../common/utils/crypto.util.js';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, USER_STATUS } from '../../config/constants.js';

export class SuperAdminUserService {
  static async listUsers({ clientId, search, role, status, page = 1, limit = 10 }) {
    const filter = {
      role: { $ne: ROLES.SUPER_ADMIN }, // Only manage client users
    };

    if (clientId && clientId !== 'all') {
      filter.clientId = clientId;
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('clientId', 'companyName clientCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async createUser({ clientId, name, email, contactNumber, role = ROLES.ADMIN_OPERATOR, status = USER_STATUS.ACTIVE }) {
    const client = await Client.findById(clientId);
    if (!client) throw AppError.notFound('Client company not found');

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`User with email '${email}' already exists.`);
    }

    const temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await User.create({
      clientId,
      name,
      email: email.toLowerCase(),
      contactNumber,
      role,
      status,
      passwordHash,
      mustChangePassword: true,
    });

    return {
      user,
      temporaryPassword,
    };
  }

  static async updateUser(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('clientId', 'companyName clientCode');

    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  static async toggleStatus(id) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('User not found');

    user.status = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
    await user.save();
    return user;
  }

  static async resetPassword(id) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('User not found');
    const temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    const passwordHash = await hashPassword(temporaryPassword);
    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    await user.save();
    return { success: true, email: user.email, temporaryPassword };
  }

  static async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw AppError.notFound('User not found');
    return { success: true, message: 'User deleted' };
  }
}
