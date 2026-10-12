import crypto from 'crypto';
import { Client } from './model.js';
import { User } from '../users/model.js';
import { EmailTemplateService } from '../email-templates/service.js';
import { EmailService } from '../../integrations/email/nodemailer.service.js';
import { hashPassword } from '../../common/utils/crypto.util.js';
import { AppError } from '../../common/errors/app-error.js';
import { CLIENT_STATUS, ROLES, USER_STATUS } from '../../config/constants.js';
import { env } from '../../config/env.js';

export class ClientService {
  /**
   * Core Business Rule: Create client, tenant workspace, admin credentials, and email credentials
   */
  static async createClient({
    companyName,
    adminName,
    adminEmail,
    contactNumber,
    plan = 'Enterprise Scale',
    initialCredits = 10000,
    assignedPhoneNumbers = [],
  }) {
    // 1. Verify email uniqueness
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict(`A user with email '${adminEmail}' already exists.`);
    }

    // 2. Generate unique client code e.g. CLI-2849
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const clientCode = `CLI-${randomCode}`;

    // 3. Create Client Tenant Record
    const client = await Client.create({
      companyName,
      clientCode,
      status: CLIENT_STATUS.ACTIVE,
      plan,
      contactNumber,
      adminEmail: adminEmail.toLowerCase(),
      assignedPhoneNumbers,
      credits: initialCredits,
      settings: {
        defaultLanguage: 'en_US',
        maxConcurrentCalls: 25,
        timezone: 'America/New_York',
        enableAutoRetry: true,
      },
    });

    // 4. Generate random secure temporary password
    const temporaryPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    const passwordHash = await hashPassword(temporaryPassword);

    // 5. Create Client's Initial Admin User with mustChangePassword: true
    const adminUser = await User.create({
      clientId: client._id,
      name: adminName || `${companyName} Admin`,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: true,
      contactNumber,
    });

    // 6. Send credentials via email using "Client Credential Email" template
    try {
      const emailTemplate = await EmailTemplateService.getTemplateByName('Client Credential Email');
      if (emailTemplate) {
        const variables = {
          company_name: client.companyName,
          client_code: client.clientCode,
          admin_email: adminUser.email,
          temporary_password: temporaryPassword,
          login_url: env.APP_URL,
        };

        const renderedSubject = EmailService.renderTemplate(emailTemplate.subject, variables);
        const renderedHtml = EmailService.renderTemplate(emailTemplate.bodyHtml, variables);

        await EmailService.sendEmail({
          to: adminUser.email,
          subject: renderedSubject,
          html: renderedHtml,
        });
      }
    } catch (emailErr) {
      // Log failure but preserve client record
    }

    return {
      client,
      adminUser: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        mustChangePassword: adminUser.mustChangePassword,
      },
      generatedCredentials: {
        email: adminUser.email,
        temporaryPassword,
        loginUrl: env.APP_URL,
      },
    };
  }

  /**
   * List clients with filtering, search, and pagination
   */
  static async listClients({ search, status, plan, page = 1, limit = 10 }) {
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (plan && plan !== 'all') {
      filter.plan = plan;
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(filter),
    ]);

    // Attach admin user info (lastLoginAt) for each client
    const clientIds = clients.map((c) => c._id);
    const adminUsers = await User.find({
      clientId: { $in: clientIds },
      role: ROLES.ADMIN,
    }).lean();

    const adminMap = new Map();
    adminUsers.forEach((u) => {
      adminMap.set(u.clientId.toString(), u);
    });

    const enrichedClients = clients.map((c) => {
      const admin = adminMap.get(c._id.toString());
      return {
        ...c,
        adminName: admin?.name || '',
        lastLoginAt: admin?.lastLoginAt || null,
      };
    });

    return {
      clients: enrichedClients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getClientById(id) {
    const client = await Client.findById(id).lean();
    if (!client) throw AppError.notFound('Client not found');

    const admin = await User.findOne({ clientId: id, role: ROLES.ADMIN }).lean();
    return {
      ...client,
      adminUser: admin
        ? {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            status: admin.status,
            lastLoginAt: admin.lastLoginAt,
          }
        : null,
    };
  }

  static async updateClient(id, updateData) {
    const client = await Client.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!client) throw AppError.notFound('Client not found');
    return client;
  }

  static async updateStatus(id, newStatus) {
    if (!Object.values(CLIENT_STATUS).includes(newStatus)) {
      throw AppError.badRequest(`Invalid client status: ${newStatus}`);
    }

    const client = await Client.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true }
    );
    if (!client) throw AppError.notFound('Client not found');

    // Cascade status to tenant users
    const userStatus = newStatus === CLIENT_STATUS.ACTIVE ? USER_STATUS.ACTIVE : USER_STATUS.INACTIVE;
    await User.updateMany({ clientId: id }, { $set: { status: userStatus } });

    return client;
  }

  static async resetPassword(clientId) {
    const client = await Client.findById(clientId);
    if (!client) throw AppError.notFound('Client not found');

    const adminUser = await User.findOne({ clientId, role: ROLES.ADMIN });
    if (!adminUser) throw AppError.notFound('Client Admin user not found');

    const newPassword = `AC#${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
    adminUser.passwordHash = await hashPassword(newPassword);
    adminUser.mustChangePassword = true;
    await adminUser.save();

    // Send email with new password
    const emailTemplate = await EmailTemplateService.getTemplateByName('Client Credential Email');
    if (emailTemplate) {
      const variables = {
        company_name: client.companyName,
        client_code: client.clientCode,
        admin_email: adminUser.email,
        temporary_password: newPassword,
        login_url: env.APP_URL,
      };

      const renderedSubject = `[Reset] ${EmailService.renderTemplate(emailTemplate.subject, variables)}`;
      const renderedHtml = EmailService.renderTemplate(emailTemplate.bodyHtml, variables);

      await EmailService.sendEmail({
        to: adminUser.email,
        subject: renderedSubject,
        html: renderedHtml,
      });
    }

    return {
      success: true,
      email: adminUser.email,
      temporaryPassword: newPassword,
      message: 'Client administrator password reset and emailed successfully',
    };
  }

  static async deleteClient(id) {
    const client = await Client.findByIdAndDelete(id);
    if (!client) throw AppError.notFound('Client not found');

    await User.deleteMany({ clientId: id });
    return { success: true, message: 'Client and associated tenant data removed' };
  }
}
