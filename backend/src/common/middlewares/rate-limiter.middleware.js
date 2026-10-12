import { AppError } from '../errors/app-error.js';

// In-memory sliding window fallback, scalable to Redis when needed
const requestCounts = new Map();

export const rateLimiter = ({
  windowMs = 60 * 1000,
  maxPerWindow = 120,
  maxBurstPerSec = 30,
} = {}) => {
  return (req, res, next) => {
    const key = req.headers['x-api-key'] || req.ip || 'anonymous';
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        windowStart: now,
        count: 0,
        secondStart: Math.floor(now / 1000),
        burstCount: 0,
      });
    }

    const record = requestCounts.get(key);

    // Check burst rate (per second)
    const currentSec = Math.floor(now / 1000);
    if (record.secondStart === currentSec) {
      record.burstCount += 1;
      if (record.burstCount > maxBurstPerSec) {
        return next(AppError.tooManyRequests('Burst limit exceeded: Max 30 requests per second.'));
      }
    } else {
      record.secondStart = currentSec;
      record.burstCount = 1;
    }

    // Check window rate (per minute)
    if (now - record.windowStart < windowMs) {
      record.count += 1;
      if (record.count > maxPerWindow) {
        return next(AppError.tooManyRequests('Rate limit exceeded: 120 requests per minute limit reached.'));
      }
    } else {
      record.windowStart = now;
      record.count = 1;
    }

    next();
  };
};
