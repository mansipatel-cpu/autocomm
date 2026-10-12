import { Router } from 'express';
import { TemplateController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TemplateController.list);
router.get('/stats', TemplateController.stats);
router.post('/whatsapp', TemplateController.createWhatway);
router.post('/voice', TemplateController.createVoice);
router.post('/sync-meta', TemplateController.syncMeta);
router.delete('/:id', TemplateController.delete);

export default router;
