import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isMock: process.env.MOCK_AUTOCOMM === 'true' || process.env.MOCK_AUTOCOMM === '1',
  enableDirectDispatch: process.env.ENABLE_DIRECT_DISPATCH === 'true',

  autocomm: {
    baseUrl: (process.env.AUTOCOMM_BASE_URL || 'https://YOUR_AUTOCOMM_URL/api').replace(/\/+$/, ''),
    apiKey: process.env.AUTOCOMM_API_KEY || '',
    apiSecret: process.env.AUTOCOMM_API_SECRET || '',
    channelId: process.env.AUTOCOMM_CHANNEL_ID || '',
    groupId: process.env.AUTOCOMM_GROUP_ID || '',
    templateName: process.env.AUTOCOMM_TEMPLATE_NAME || '',
    waCampaignId: process.env.AUTOCOMM_WA_CAMPAIGN_ID || '',
    callCampaignId: process.env.AUTOCOMM_CALL_CAMPAIGN_ID || '',
  },

  admin: {
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'CHANGE_ME',
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    wabaId: process.env.WHATSAPP_WABA_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'hello_world',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
  },

  elevenlabs: {
    webhookSecret: process.env.ELEVENLABS_WEBHOOK_SECRET || '',
    webhookUrl: process.env.ELEVENLABS_WEBHOOK_URL || '',
  },
};
