import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { logger } from '../config/logger.js';

let campaignDispatchQueue = null;
let campaignRetryQueue = null;

try {
  campaignDispatchQueue = new Queue('campaign-dispatch', {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  campaignRetryQueue = new Queue('campaign-retry', {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      delay: 15 * 60 * 1000, // 15-minute retry fallback
      removeOnComplete: true,
    },
  });

  logger.info('BullMQ campaign queues initialized.');
} catch (err) {
  logger.warn('Redis queue connection deferred; running with inline job fallback.');
}

export const enqueueCampaignDispatch = async (campaignId, clientId) => {
  if (campaignDispatchQueue) {
    try {
      return await campaignDispatchQueue.add('dispatch', { campaignId, clientId });
    } catch (err) {
      logger.warn(`Could not enqueue to Redis BullMQ: ${err.message}. Processing directly in background.`);
    }
  }

  // Graceful background execution fallback
  setTimeout(async () => {
    try {
      const { processCampaignDispatch } = await import('../workers/campaign.worker.js');
      await processCampaignDispatch(campaignId, clientId);
    } catch (e) {
      logger.error('Background dispatch fallback failed:', e);
    }
  }, 500);
};

export const enqueueCampaignRetry = async (recipientId, campaignId) => {
  if (campaignRetryQueue) {
    try {
      return await campaignRetryQueue.add('retry-dispatch', { recipientId, campaignId });
    } catch (err) {
      logger.warn(`Could not enqueue retry to Redis: ${err.message}`);
    }
  }
};
