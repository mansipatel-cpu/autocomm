import { Router } from 'express';
import multer from 'multer';
import { TemplateController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const upload = multer();
const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TemplateController.list);
router.get('/stats', TemplateController.stats);
router.post('/', upload.any(), TemplateController.createWhatway);
router.post('/whatsapp', upload.any(), TemplateController.createWhatway);
router.post('/voice', upload.any(), TemplateController.createVoice);
router.post('/sync', TemplateController.syncMeta);
router.post('/sync-meta', TemplateController.syncMeta);
router.get('/:id/meta', (_req, res) => res.json({
  success: true,
  headerType: 'text',
  hasLimitedTimeOffer: false,
  meta: {
    headerType: 'text',
    hasLimitedTimeOffer: false,
  },
}));
router.get('/:id', TemplateController.getById);
router.post('/:id/use', TemplateController.use);
router.put('/:id', (req, res) => res.json({ success: true, id: req.params.id, ...req.body }));
router.delete('/:id', TemplateController.delete);

export default router;
