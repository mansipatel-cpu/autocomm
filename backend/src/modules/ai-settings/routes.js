import { Router } from 'express';
import { AiSettingsController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', AiSettingsController.getSettings);
router.get('/channel/:channelId', AiSettingsController.getByChannel);
router.put('/', AiSettingsController.updateSettings);
router.put('/:id', AiSettingsController.updateById);
router.post('/', AiSettingsController.create);
router.post('/test', AiSettingsController.testChat);

export default router;
