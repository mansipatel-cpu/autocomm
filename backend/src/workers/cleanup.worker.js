import cron from 'node-cron';
import { Campaign, CampaignRecipient } from '../modules/campaigns/model.js';
import { logger } from '../config/logger.js';

export const purgeExpiredDeletedCampaigns = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredCampaigns = await Campaign.find({
      isDeleted: true,
      deletedAt: { $lte: thirtyDaysAgo },
    });

    if (expiredCampaigns.length > 0) {
      const ids = expiredCampaigns.map((c) => c._id);
      await CampaignRecipient.deleteMany({ campaignId: { $in: ids } });
      const res = await Campaign.deleteMany({ _id: { $in: ids } });
      logger.info(`🧹 Auto-purged ${res.deletedCount} campaigns deleted over 30 days ago.`);
    }
  } catch (error) {
    logger.error('Error during 30-day campaign purge routine:', error);
  }
};

// Schedule daily cleanup at 00:00 (midnight)
cron.schedule('0 0 * * *', () => {
  logger.info('Running daily 30-day deleted campaigns auto-purge routine...');
  purgeExpiredDeletedCampaigns();
});
