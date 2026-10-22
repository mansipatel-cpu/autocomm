import crypto from 'crypto';
import { User } from './model.js';
import { Contact } from '../contacts/model.js';
import { Client } from '../clients/model.js';
import { hashPassword } from '../../common/utils/crypto.util.js';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, USER_STATUS } from '../../config/constants.js';

export class SuperAdminUserService {
  static async listUsers({ clientId, search, role, status, page = 1, limit = 10 }) {
    // 1. Build contact filter
    const contactFilter = {};
    if (clientId && clientId !== 'all') {
      contactFilter.clientId = clientId;
    }
    if (status && status !== 'all') {
      contactFilter.status = { $regex: status, $options: 'i' };
    }
    if (search) {
      contactFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // 2. Build user filter
    const userFilter = {
      role: { $ne: ROLES.SUPER_ADMIN },
      clientId: { $ne: null },
    };
    if (clientId && clientId !== 'all') {
      userFilter.clientId = clientId;
    }
    if (status && status !== 'all') {
      userFilter.status = status;
    }
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // 3. Fetch contacts and users
    const [rawContacts, rawUsers] = await Promise.all([
      Contact.find(contactFilter).sort({ createdAt: -1 }).lean().catch(() => []),
      User.find(userFilter).sort({ createdAt: -1 }).lean().catch(() => []),
    ]);

    const formattedContacts = (Array.isArray(rawContacts) ? rawContacts : []).map((c) => ({
      id: c.id,
      _id: c.id,
      name: c.name,
      email: c.email || '—',
      contactNumber: c.phoneNumber || c.whatsappNumber || '—',
      phoneNumber: c.phoneNumber || '',
      clientId: c.clientId,
      status: (c.status || 'active').toLowerCase(),
      createdAt: c.createdAt,
      lastLogin: c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString() : '—',
      source: 'contact',
    }));

    const formattedUsers = (Array.isArray(rawUsers) ? rawUsers : []).map((u) => ({
      id: u.id,
      _id: u.id,
      name: u.name,
      email: u.email,
      contactNumber: u.contactNumber || '—',
      phoneNumber: u.contactNumber || '',
      clientId: u.clientId,
      status: (u.status || 'active').toLowerCase(),
      createdAt: u.createdAt,
      lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—',
      source: 'user',
    }));

    // Merge contacts first, then users (avoiding duplicates if email matches)
    const combined = [
      ...formattedContacts,
      ...formattedUsers.filter((u) => !formattedContacts.some((c) => c.email && c.email !== '—' && c.email.toLowerCase() === u.email?.toLowerCase())),
    ];

    const total = combined.length;
    const skip = (page - 1) * limit;
    const paginated = combined.slice(skip, skip + limit);

    // Populate Client details
    const clientIds = [...new Set(paginated.map((u) => u.clientId).filter(Boolean))];
    if (clientIds.length > 0) {
      try {
        const clients = await Client.find({ id: { $in: clientIds } });
        const clientList = Array.isArray(clients) ? clients : [];
        const clientMap = new Map(clientList.map((c) => [String(c.id || c._id), c]));
        for (const u of paginated) {
          if (u.clientId && clientMap.has(String(u.clientId))) {
            const c = clientMap.get(String(u.clientId));
            u.clientId = { _id: c.id || c._id, companyName: c.companyName, clientCode: c.clientCode };
          }
        }
      } catch {
        // Fallback silently
      }
    }

    return {
      users: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async createUser({ clientId, name, email, contactNumber, role = ROLES.ADMIN, status = USER_STATUS.ACTIVE }) {
    const client = await Client.findById(clientId);
    if (!client) throw AppError.notFound('Client company not found');

    // 1. Create in Contact so it syncs with Client App
    const contact = await Contact.create({
      clientId,
      name,
      email: email ? email.toLowerCase() : '',
      phoneNumber: contactNumber || '',
      status: status === 'active' ? 'Active' : 'Inactive',
    });

    // 2. Also create User record with login credentials if email provided
    let temporaryPassword = null;
    let user = null;
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
        const passwordHash = await hashPassword(temporaryPassword);
        user = await User.create({
          clientId,
          name,
          email: email.toLowerCase(),
          contactNumber,
          role,
          status,
          passwordHash,
          mustChangePassword: true,
        });
      }
    }

    return {
      user: {
        id: contact.id,
        _id: contact.id,
        name: contact.name,
        email: contact.email,
        contactNumber: contact.phoneNumber,
        status: (contact.status || 'active').toLowerCase(),
        createdAt: contact.createdAt,
      },
      temporaryPassword,
    };
  }

  static async updateUser(id, updateData) {
    const contactUpdate = {};
    if (updateData.name) contactUpdate.name = updateData.name;
    if (updateData.email) contactUpdate.email = updateData.email.toLowerCase();
    if (updateData.contactNumber) contactUpdate.phoneNumber = updateData.contactNumber;
    if (updateData.status) contactUpdate.status = updateData.status === 'active' ? 'Active' : 'Inactive';
    if (updateData.clientId) contactUpdate.clientId = updateData.clientId;

    const contact = await Contact.findByIdAndUpdate(id, { $set: contactUpdate }, { new: true }).catch(() => null);
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).catch(() => null);

    const result = contact || user;
    if (!result) throw AppError.notFound('Client user/contact not found');
    return result;
  }

  static async toggleStatus(id) {
    const contact = await Contact.findById(id).catch(() => null);
    if (contact) {
      contact.status = contact.status === 'Active' ? 'Inactive' : 'Active';
      await contact.save();
      return contact;
    }
    const user = await User.findById(id).catch(() => null);
    if (!user) throw AppError.notFound('Client user/contact not found');
    user.status = user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE;
    await user.save();
    return user;
  }

  static async resetPassword(id) {
    let user = await User.findById(id).catch(() => null);
    if (!user) {
      const contact = await Contact.findById(id).catch(() => null);
      if (contact && contact.email && contact.email !== '—') {
        const temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
        const passwordHash = await hashPassword(temporaryPassword);
        user = await User.create({
          clientId: contact.clientId,
          name: contact.name,
          email: contact.email.toLowerCase(),
          contactNumber: contact.phoneNumber,
          role: ROLES.ADMIN,
          status: USER_STATUS.ACTIVE,
          passwordHash,
          mustChangePassword: true,
        });
        return { success: true, email: user.email, temporaryPassword };
      }
      throw AppError.notFound('User not found or has no email address');
    }
    const temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    const passwordHash = await hashPassword(temporaryPassword);
    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    await user.save();
    return { success: true, email: user.email, temporaryPassword };
  }

  static async deleteUser(id) {
    const deletedContact = await Contact.findByIdAndDelete(id).catch(() => null);
    const deletedUser = await User.findByIdAndDelete(id).catch(() => null);
    if (!deletedContact && !deletedUser) throw AppError.notFound('Client user/contact not found');
    return { success: true, message: 'Deleted successfully' };
  }
}
