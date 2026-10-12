import { Router } from 'express';
import { AiSettingsController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AiSettingsController.getSettings);
router.put('/', AiSettingsController.updateSettings);
router.post('/test', AiSettingsController.testChat);

export default router;
