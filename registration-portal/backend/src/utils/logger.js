/**
 * Secure Logger
 * Rule 3: Never log secrets. Mask phone numbers in logs.
 */

// Mask phone number: e.g. "+919876543210" -> "+91 98*** **210" or "+14155552671" -> "+1 415*** *671"
export const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return '******';
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-3);
  return `${prefix}*** **${suffix}`;
};

// Mask sensitive keys recursively in objects
export const sanitizeForLog = (obj) => {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Check if string contains full E.164 phone number pattern
      return obj.replace(/\+?[1-9]\d{9,14}/g, (match) => maskPhone(match));
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLog);
  }

  const sanitized = {};
  const secretKeys = new Set([
    'x-api-key',
    'x-api-secret',
    'apikey',
    'apisecret',
    'autocomm_api_key',
    'autocomm_api_secret',
    'admin_password',
    'adminpassword',
    'password',
    'secret',
    'webhook_secret',
    'webhooksecret',
    'authorization',
  ]);

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (secretKeys.has(lowerKey)) {
      sanitized[key] = '***REDACTED_SECRET***';
    } else if (lowerKey.includes('phone') && typeof value === 'string') {
      sanitized[key] = maskPhone(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta) => {
    if (meta !== undefined) {
      console.log(`[${timestamp()}] [INFO] ${message}`, sanitizeForLog(meta));
    } else {
      console.log(`[${timestamp()}] [INFO] ${message}`);
    }
  },

  warn: (message, meta) => {
    if (meta !== undefined) {
      console.warn(`[${timestamp()}] [WARN] ${message}`, sanitizeForLog(meta));
    } else {
      console.warn(`[${timestamp()}] [WARN] ${message}`);
    }
  },

  error: (message, meta) => {
    if (meta !== undefined) {
      console.error(`[${timestamp()}] [ERROR] ${message}`, sanitizeForLog(meta));
    } else {
      console.error(`[${timestamp()}] [ERROR] ${message}`);
    }
  },

  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      if (meta !== undefined) {
        console.log(`[${timestamp()}] [DEBUG] ${message}`, sanitizeForLog(meta));
      } else {
        console.log(`[${timestamp()}] [DEBUG] ${message}`);
      }
    }
  },
};
