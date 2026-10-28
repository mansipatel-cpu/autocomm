import { getPostgresPool } from '../config/postgres.js';
import { logger } from '../config/logger.js';
import { processCampaignDispatch } from './campaign.worker.js';

let isRunning = false;

export const checkScheduledCampaigns = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const p = getPostgresPool();
    const result = await p.query(`
      SELECT id, client_id, name, channel_type, scheduled_at
      FROM campaigns
      WHERE status ILIKE 'Scheduled'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
        AND is_deleted = FALSE
      ORDER BY scheduled_at ASC
      LIMIT 20;
    `);

    if (result && result.rows && result.rows.length > 0) {
      for (const campaign of result.rows) {
        logger.info(`⏰ Scheduled time reached for Campaign ${campaign.id} ("${campaign.name}"). Starting automatic WhatsApp dispatch...`);
        try {
          await p.query(`UPDATE campaigns SET status = 'Ongoing' WHERE id = $1`, [campaign.id]);
          processCampaignDispatch(campaign.id, campaign.client_id).catch((err) => {
            logger.error(`[Scheduled Campaign ${campaign.id} dispatch error]:`, err?.message || err);
          });
        } catch (dispatchErr) {
          logger.error(`[Scheduled Campaign ${campaign.id} trigger error]:`, dispatchErr?.message || dispatchErr);
        }
      }
    }
  } catch (err) {
    logger.debug(`[ScheduledCampaigns check error]: ${err?.message || err}`);
  } finally {
    isRunning = false;
  }
};

export const startCampaignScheduler = () => {
  logger.info('⏰ Campaign Scheduler service started (checking scheduled campaigns every 15s)...');
  // Initial check
  checkScheduledCampaigns().catch(() => {});
  // Run interval every 15 seconds
  setInterval(() => {
    checkScheduledCampaigns().catch(() => {});
  }, 15000);
};
