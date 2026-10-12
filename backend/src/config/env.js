import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to local cwd

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
  SUPERADMIN_URL: process.env.SUPERADMIN_URL || 'http://localhost:5174',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autocomm',

  REDIS: {
    HOST: process.env.REDIS_HOST || '127.0.0.1',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
  },

  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'autocomm_access_default_secret_key',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'autocomm_refresh_default_secret_key',
    ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    SUPERADMIN_SECRET: process.env.SUPERADMIN_JWT_SECRET || 'autocomm_superadmin_default_secret_key',
    SUPERADMIN_EXPIRES_IN: process.env.SUPERADMIN_JWT_EXPIRES_IN || '8h',
  },

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',

  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || 'no-reply@autocomm.io',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'AutoComm Operations',
  },

  WHATSAPP: {
    API_VERSION: process.env.WHATSAPP_API_VERSION || 'v20.0',
    WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'autocomm_meta_webhook_secret_token',
  },

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
};
