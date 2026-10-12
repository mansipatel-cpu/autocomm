import { Router } from 'express';
import { SuperAdminAuthController } from './controller.js';
import { validate } from '../../common/middlewares/validator.middleware.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';
import { superAdminLoginSchema } from './validation.js';

const router = Router();

router.post('/login', validate(superAdminLoginSchema), SuperAdminAuthController.login);
router.get('/me', authenticateSuperAdmin, SuperAdminAuthController.getMe);

export default router;
