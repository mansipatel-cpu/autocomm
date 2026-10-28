import { Router } from 'express';
import { CampaignController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', CampaignController.list);
router.get('/deleted', CampaignController.listDeleted);
router.get('/stats', CampaignController.stats);

// General campaign creation endpoint supporting both WhatsApp and Voice
router.post('/', (req, res, next) => {
  const channelType = req.body?.channelType || req.body?.channel_type || 'whatsapp';
  if (channelType === 'voice') {
    return CampaignController.createAutoCalling(req, res, next);
  }
  return CampaignController.createWhatsApp(req, res, next);
});

router.post('/whatsapp', CampaignController.createWhatsApp);
router.post('/voice', CampaignController.createAutoCalling);
router.get('/:id', CampaignController.getDetails);
router.put('/:id', CampaignController.getDetails);
router.post('/:id/contacts-csv', CampaignController.addContactsCsv);
router.post('/:id/dispatch', async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    try {
      const { query } = await import('../../config/postgres.js');
      await query(`UPDATE campaign_recipients SET status = 'pending' WHERE campaign_id = $1`, [campaignId]);
    } catch {}
    const { processCampaignDispatch } = await import('../../workers/campaign.worker.js');
    processCampaignDispatch(campaignId, req.clientId || 1).catch(() => {});
    return res.status(200).json({ success: true, message: 'Campaign live dispatch started' });
  } catch (err) {
    next(err);
  }
});
router.delete('/:id', CampaignController.softDelete);
router.post('/:id/restore', CampaignController.restore);

export default router;
