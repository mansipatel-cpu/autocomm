import { Router } from 'express';
import { MonitoringController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/metrics', MonitoringController.getSystemMetrics);
router.get('/reports', MonitoringController.getPlatformReports);

export default router;
