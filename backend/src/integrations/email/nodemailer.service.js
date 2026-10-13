import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let transporter = null;

const createSmtpTransport = (port) => {
  const isSecure = port === 465;
  return nodemailer.createTransport({
    host: env.SMTP.HOST,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user: env.SMTP.USER,
      pass: env.SMTP.PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

const getTransporter = () => {
  if (!transporter) {
    if (env.SMTP.USER && env.SMTP.PASS) {
      const portNum = parseInt(env.SMTP.PORT, 10) || 587;
      transporter = createSmtpTransport(portNum);
      logger.info(`SMTP email transporter initialized for ${env.SMTP.HOST}:${portNum} (user: ${env.SMTP.USER})`);
    } else {
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
   * Send an email with subject and HTML content, with automatic port fallback
   */
  static async sendEmail({ to, subject, html, text }) {
    const fromAddr = env.SMTP.FROM || env.SMTP.USER || 'quizbox.ai@caperminttechnologies.com';
    const fromName = env.SMTP.FROM_NAME || 'AutoComm Operations';
    const mailOptions = {
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
    };

    if (!env.SMTP.USER || !env.SMTP.PASS) {
      const transport = getTransporter();
      const info = await transport.sendMail(mailOptions);
      logger.info(`📧 Email stored in JSON transport for ${to} [Subject: "${subject}"]`);
      return { success: true, messageId: info.messageId || 'local-json' };
    }

    // Try configured primary port first
    const primaryPort = parseInt(env.SMTP.PORT, 10) || 587;
    try {
      const primaryTransport = getTransporter();
      const info = await primaryTransport.sendMail(mailOptions);
      logger.info(`📧 Email successfully dispatched to ${to} on port ${primaryPort} [Subject: "${subject}", MessageID: ${info.messageId || 'sent'}]`);
      return { success: true, messageId: info.messageId || 'sent' };
    } catch (primaryErr) {
      logger.warn(`⚠️ Primary SMTP attempt on port ${primaryPort} failed: ${primaryErr.message}. Attempting port fallback...`);

      // Try alternate port (e.g. 587 if primary was 465, or 465 if primary was 587)
      const fallbackPort = primaryPort === 465 ? 587 : 465;
      try {
        const fallbackTransport = createSmtpTransport(fallbackPort);
        const info = await fallbackTransport.sendMail(mailOptions);
        logger.info(`📧 Email successfully dispatched to ${to} on fallback port ${fallbackPort} [Subject: "${subject}", MessageID: ${info.messageId || 'sent'}]`);
        // Update cached transporter to working port
        transporter = fallbackTransport;
        return { success: true, messageId: info.messageId || 'sent' };
      } catch (fallbackErr) {
        logger.error(`❌ Failed to send email to ${to}: ${fallbackErr.message} (Primary: ${primaryErr.message})`);
        return { success: false, error: fallbackErr.message };
      }
    }
  }
}
