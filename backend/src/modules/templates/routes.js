import { Router } from 'express';
import { TemplateController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TemplateController.list);
router.get('/stats', TemplateController.stats);
router.post('/', TemplateController.createWhatway);
router.post('/whatsapp', TemplateController.createWhatway);
router.post('/voice', TemplateController.createVoice);
router.post('/sync', TemplateController.syncMeta);
router.post('/sync-meta', TemplateController.syncMeta);
router.get('/:id/meta', (_req, res) => res.json({ success: true, meta: {} }));
router.get('/:id', TemplateController.getById);
router.post('/:id/use', TemplateController.use);
router.put('/:id', (req, res) => res.json({ success: true, id: req.params.id, ...req.body }));
router.delete('/:id', TemplateController.delete);

export default router;
