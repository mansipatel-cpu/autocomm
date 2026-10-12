import { EmailTemplate } from './model.js';
import { EmailService } from '../../integrations/email/nodemailer.service.js';
import { AppError } from '../../common/errors/app-error.js';

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: 'Client Credential Email',
    subject: 'Welcome to AutoComm - Your Company Account Credentials',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0f172a;">Welcome to AutoComm, {{company_name}}!</h2>
        <p>Your tenant workspace has been successfully provisioned on the AutoComm Dual-Channel Platform.</p>
        <p>Below are your initial administrator login credentials:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <p style="margin: 5px 0;"><strong>Client ID:</strong> {{client_code}}</p>
          <p style="margin: 5px 0;"><strong>Login Email:</strong> {{admin_email}}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{{temporary_password}}</code></p>
          <p style="margin: 5px 0;"><strong>Console URL:</strong> <a href="{{login_url}}">{{login_url}}</a></p>
        </div>
        <p style="color: #ef4444; font-size: 13px;"><em>Note: You will be required to change this temporary password upon your first login.</em></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">AutoComm Core Operations • TCPA & FIPS 140-2 Compliant</p>
      </div>
    `,
    variables: ['company_name', 'client_code', 'admin_email', 'temporary_password', 'login_url'],
    isSystem: true,
  },
  {
    name: 'Welcome Email',
    subject: 'Welcome to AutoComm Platform',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome aboard, {{name}}!</h2>
        <p>You have been invited to join {{company_name}} on AutoComm.</p>
        <p><a href="{{login_url}}" style="display: inline-block; padding: 10px 20px; background-color: #0066FF; color: white; text-decoration: none; border-radius: 6px;">Sign In to Console</a></p>
      </div>
    `,
    variables: ['name', 'company_name', 'login_url'],
    isSystem: true,
  },
  {
    name: 'Password Reset',
    subject: 'AutoComm - Password Reset Request',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. Use the link below to set a new password:</p>
        <p><a href="{{reset_url}}" style="display: inline-block; padding: 10px 20px; background-color: #0066FF; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
    variables: ['name', 'reset_url'],
    isSystem: true,
  },
  {
    name: 'Account Activation',
    subject: 'Your AutoComm Account is Now Active',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Account Activated</h2>
        <p>Dear {{company_name}}, your AutoComm tenant workspace is now active.</p>
      </div>
    `,
    variables: ['company_name'],
    isSystem: true,
  },
  {
    name: 'Account Suspension',
    subject: 'AutoComm Notice: Account Suspended',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Notice of Suspension</h2>
        <p>Dear {{company_name}}, your AutoComm workspace has been suspended. Reason: {{reason}}.</p>
      </div>
    `,
    variables: ['company_name', 'reason'],
    isSystem: true,
  },
  {
    name: 'User Invitation',
    subject: 'You have been invited to AutoComm',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Team Invitation</h2>
        <p>You have been assigned the role of {{role}} in {{company_name}}.</p>
        <p>Temporary Password: {{temporary_password}}</p>
      </div>
    `,
    variables: ['company_name', 'role', 'temporary_password', 'login_url'],
    isSystem: true,
  },
  {
    name: 'Phone Number Assignment',
    subject: 'Dedicated Phone Number Assigned to Your Workspace',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Phone Number Assigned</h2>
        <p>The phone number <strong>{{phone_number}}</strong> has been provisioned for {{company_name}}.</p>
      </div>
    `,
    variables: ['company_name', 'phone_number'],
    isSystem: true,
  },
  {
    name: 'Flow Assignment',
    subject: 'Visual Flow Assigned: {{flow_name}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Flow Assigned</h2>
        <p>The conversational flow <strong>{{flow_name}}</strong> is now available in your workspace.</p>
      </div>
    `,
    variables: ['company_name', 'flow_name'],
    isSystem: true,
  },
  {
    name: 'Flow Activation',
    subject: 'Visual Flow Activated: {{flow_name}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Flow Activated</h2>
        <p>The flow <strong>{{flow_name}}</strong> has been enabled for outbound and inbound dispatches.</p>
      </div>
    `,
    variables: ['company_name', 'flow_name'],
    isSystem: true,
  },
  {
    name: 'System Notification',
    subject: 'AutoComm System Notification: {{title}}',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>{{title}}</h2>
        <p>{{message}}</p>
      </div>
    `,
    variables: ['title', 'message'],
    isSystem: true,
  },
];

export class EmailTemplateService {
  static async ensureDefaultTemplates() {
    for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
      await EmailTemplate.findOneAndUpdate(
        { name: tpl.name },
        { $setOnInsert: tpl },
        { upsert: true, new: true }
      );
    }
  }

  static async listTemplates() {
    await this.ensureDefaultTemplates();
    return EmailTemplate.find().sort({ isSystem: -1, name: 1 });
  }

  static async getTemplateByName(name) {
    let tpl = await EmailTemplate.findOne({ name });
    if (!tpl) {
      await this.ensureDefaultTemplates();
      tpl = await EmailTemplate.findOne({ name });
    }
    return tpl;
  }

  static async getTemplateById(id) {
    const tpl = await EmailTemplate.findById(id);
    if (!tpl) throw AppError.notFound('Email template not found');
    return tpl;
  }

  static async updateTemplate(id, data) {
    const tpl = await EmailTemplate.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!tpl) throw AppError.notFound('Email template not found');
    return tpl;
  }

  static async sendTestEmail(id, recipientEmail) {
    const tpl = await this.getTemplateById(id);
    const mockVariables = {};
    (tpl.variables || []).forEach((v) => {
      mockVariables[v] = `[SAMPLE_${v.toUpperCase()}]`;
    });

    const renderedHtml = EmailService.renderTemplate(tpl.bodyHtml, mockVariables);
    const renderedSubject = EmailService.renderTemplate(tpl.subject, mockVariables);

    return EmailService.sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${renderedSubject}`,
      html: renderedHtml,
    });
  }
}
