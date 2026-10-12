import { Worker } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { Campaign, CampaignRecipient } from '../modules/campaigns/model.js';
import { CAMPAIGN_STATUS } from '../config/constants.js';
import { logger } from '../config/logger.js';
import { enqueueCampaignRetry } from '../queues/campaign.queue.js';

export const processCampaignDispatch = async (campaignId, clientId) => {
  logger.info(`Starting dispatch for Campaign: ${campaignId}`);

  const campaign = await Campaign.findOne({ _id: campaignId, clientId });
  if (!campaign) return;

  campaign.status = CAMPAIGN_STATUS.ONGOING;
  campaign.startedAt = campaign.startedAt || new Date();
  await campaign.save();

  const recipients = await CampaignRecipient.find({ campaignId, status: 'pending' });
  let sentCount = campaign.metrics.sent || 0;
  let deliveredCount = campaign.metrics.delivered || 0;
  let readCount = campaign.metrics.read || 0;
  let answeredCount = campaign.metrics.answered || 0;
  let failedCount = campaign.metrics.failed || 0;

  for (const recipient of recipients) {
    recipient.dispatchedAt = new Date();

    if (campaign.channelType === 'whatsapp') {
      // Simulate Meta WhatsApp dispatch
      const isFailed = Math.random() < 0.05; // 5% mock delivery failure
      if (isFailed) {
        recipient.status = 'failed';
        recipient.errorDetails = '131026: Undeliverable message (Number not registered on WhatsApp)';
        failedCount++;

        if (campaign.enableAutoRetry) {
          await enqueueCampaignRetry(recipient._id, campaign._id);
        }
      } else {
        recipient.status = 'read';
        sentCount++;
        deliveredCount++;
        readCount++;
      }
    } else {
      // Simulate Auto Calling dispatch
      const isAnswered = Math.random() < 0.8; // 80% answer rate
      if (isAnswered) {
        recipient.status = 'answered';
        answeredCount++;
      } else {
        recipient.status = 'failed';
        recipient.errorDetails = 'Line Busy / No Answer';
        failedCount++;
      }
    }

    await recipient.save();
  }

  const total = campaign.metrics.totalRecipients || recipients.length;
  const processed = sentCount + answeredCount + failedCount;
  const progressPercent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 100;

  campaign.metrics = {
    totalRecipients: total,
    sent: sentCount,
    delivered: deliveredCount,
    read: readCount,
    answered: answeredCount,
    failed: failedCount,
    progressPercent,
  };

  campaign.status = CAMPAIGN_STATUS.COMPLETED;
  campaign.completedAt = new Date();
  await campaign.save();

  logger.info(`Campaign ${campaignId} completed. Progress: ${progressPercent}%.`);
};

// Initialize BullMQ Worker when process starts with Redis
try {
  const worker = new Worker(
    'campaign-dispatch',
    async (job) => {
      const { campaignId, clientId } = job.data;
      await processCampaignDispatch(campaignId, clientId);
    },
    { connection: redisConnectionOptions }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} dispatched successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
  });
} catch (e) {
  // Graceful fallback
}
