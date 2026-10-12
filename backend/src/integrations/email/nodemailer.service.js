import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (env.SMTP.USER && env.SMTP.PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP.HOST,
        port: env.SMTP.PORT,
        secure: env.SMTP.PORT === 465,
        auth: {
          user: env.SMTP.USER,
          pass: env.SMTP.PASS,
        },
      });
    } else {
      // In development when credentials are not supplied, create a mock ethereal or JSON transport
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      logger.info('Using JSON email transport (SMTP credentials not configured in env).');
    }
  }
  return transporter;
};

export class EmailService {
  /**
   * Render template string replacing {{variable}} placeholders
   */
  static renderTemplate(templateString, variables = {}) {
    return templateString.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      return variables[trimmed] !== undefined ? variables[trimmed] : `{{${trimmed}}}`;
    });
  }

  /**
   * Send an email with subject and HTML content
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      const transport = getTransporter();
      const mailOptions = {
        from: `"${env.SMTP.FROM_NAME}" <${env.SMTP.FROM}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      };

      const info = await transport.sendMail(mailOptions);
      logger.info(`📧 Email sent to ${to} [Subject: "${subject}"]`);
      if (info.message) {
        logger.debug(`Email content: ${info.message}`);
      }
      return { success: true, messageId: info.messageId || 'mock-id' };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }
}
