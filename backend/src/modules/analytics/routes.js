import { Router } from 'express';
import { AnalyticsController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AnalyticsController.getTenantAnalytics);

export default router;
