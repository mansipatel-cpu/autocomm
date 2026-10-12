import { Router } from 'express';
import { CampaignController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', CampaignController.list);
router.get('/deleted', CampaignController.listDeleted);
router.get('/stats', CampaignController.stats);
router.post('/whatsapp', CampaignController.createWhatsApp);
router.post('/voice', CampaignController.createAutoCalling);
router.get('/:id', CampaignController.getDetails);
router.post('/:id/contacts-csv', CampaignController.addContactsCsv);
router.delete('/:id', CampaignController.softDelete);
router.post('/:id/restore', CampaignController.restore);

export default router;
