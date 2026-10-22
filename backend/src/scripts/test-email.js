import { EmailService } from '../integrations/email/nodemailer.service.js';
import { logger } from '../config/logger.js';

const testRecipient = process.argv[2] || 'quizbox.ai@caperminttechnologies.com';

const test = async () => {
  logger.info(`🧪 Testing email dispatch to: ${testRecipient}...`);
  const result = await EmailService.sendEmail({
    to: testRecipient,
    subject: 'AutoComm SMTP Verification Test',
    html: '<h2>AutoComm SMTP is working!</h2><p>This is a verification email from AutoComm matching omnichannel-saas configuration.</p>',
    text: 'AutoComm SMTP is working! This is a verification email from AutoComm matching omnichannel-saas configuration.',
  });

  if (result.success) {
    logger.info(`🎉 Email test succeeded! MessageID: ${result.messageId}`);
    process.exit(0);
  } else {
    logger.error(`❌ Email test failed: ${result.error}`);
    process.exit(1);
  }
};

test();
