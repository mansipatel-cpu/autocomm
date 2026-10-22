import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let transporter = null;

const getSmtpCredentials = () => {
  const host = process.env.SMTP_HOST || env.SMTP?.HOST || 'mail.caperminttechnologies.com';
  const port = parseInt(process.env.SMTP_PORT || env.SMTP?.PORT || '465', 10);
  const user = (process.env.SMTP_USER || env.SMTP?.USER || 'quizbox.ai@caperminttechnologies.com').trim();
  let rawPass = process.env.SMTP_PASS || env.SMTP?.PASS || 'Capermint!@#123';
  // Strip any wrapping quotes from .env
  let pass = rawPass.trim().replace(/^["']|["']$/g, '');

  // Guard against dotenv inline comment truncation where unquoted `#` in Capermint!@#123 truncated the string
  if (pass === 'Capermint!@' || (pass.startsWith('Capermint!@') && !pass.includes('#123'))) {
    pass = 'Capermint!@#123';
  }

  return { host, port, user, pass };
};

const createSmtpTransport = (port) => {
  const creds = getSmtpCredentials();
  const portNum = parseInt(port || creds.port, 10);
  const isSecure = portNum === 465;

  return nodemailer.createTransport({
    host: creds.host,
    port: portNum,
    secure: isSecure,
    requireTLS: portNum === 587,
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const getTransporter = () => {
  const creds = getSmtpCredentials();
  if (creds.user && creds.pass) {
    return createSmtpTransport(creds.port);
  }
  return nodemailer.createTransport({
    jsonTransport: true,
  });
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
   * Send an email with subject and HTML content, with automatic port fallback and retry
   */
  static async sendEmail({ to, subject, html, text }) {
    const creds = getSmtpCredentials();
    const fromAddr = process.env.EMAIL_FROM || creds.user || 'quizbox.ai@caperminttechnologies.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'AutoComm Operations';
    const textBody = text || html.replace(/<[^>]*>?/gm, '');
    const mailOptions = {
      from: `"${fromName}" <${fromAddr}>`,
      to,
      subject,
      html,
      text: textBody,
    };

    if (!creds.user || !creds.pass) {
      const transport = getTransporter();
      const info = await transport.sendMail(mailOptions);
      logger.info(`📧 Email stored in JSON transport for ${to} [Subject: "${subject}"]`);
      return { success: true, messageId: info.messageId || 'local-json' };
    }

    const primaryPort = creds.port || 465;
    const retryableCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'EAI_AGAIN']);
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = attempt * 1000;
          logger.info(`🔄 [Email] Retry ${attempt}/${maxRetries} to ${to} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const transport = getTransporter();
        const info = await transport.sendMail(mailOptions);
        logger.info(`📧 Email successfully dispatched to ${to} on port ${primaryPort} [Subject: "${subject}", MessageID: ${info.messageId || 'sent'}]`);
        return { success: true, messageId: info.messageId || 'sent' };
      } catch (err) {
        logger.warn(`⚠️ [Email] Attempt ${attempt + 1} failed for ${to} on port ${primaryPort}: ${err.message}`);

        // Reset cached transporter on failure so stale sockets or wrong creds are recreated
        transporter = null;

        // If port 465 failed on first attempt, try fallback port 587 (or vice-versa)
        if (attempt === 0) {
          const fallbackPort = primaryPort === 465 ? 587 : 465;
          try {
            logger.info(`🔄 Attempting alternate SMTP port ${fallbackPort}...`);
            const fallbackTransport = createSmtpTransport(fallbackPort);
            const info = await fallbackTransport.sendMail(mailOptions);
            logger.info(`📧 Email successfully dispatched to ${to} on fallback port ${fallbackPort} [MessageID: ${info.messageId || 'sent'}]`);
            transporter = fallbackTransport;
            return { success: true, messageId: info.messageId || 'sent' };
          } catch (fallbackErr) {
            logger.warn(`⚠️ Fallback port ${fallbackPort} attempt also failed: ${fallbackErr.message}`);
          }
        }

        if (attempt === maxRetries || !retryableCodes.has(err?.code)) {
          logger.error(`❌ Failed to send email to ${to}: ${err.message}`);
          return { success: false, error: err.message };
        }
      }
    }
  }
}
