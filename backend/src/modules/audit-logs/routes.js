import { Router } from 'express';
import { AuditLogController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', AuditLogController.list);

export default router;
