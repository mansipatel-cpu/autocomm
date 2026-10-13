import { Router } from 'express';
import { SuperAdminUserController } from './superadmin-user.controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', SuperAdminUserController.list);
router.post('/', SuperAdminUserController.create);
router.put('/:id', SuperAdminUserController.update);
router.patch('/:id/toggle-status', SuperAdminUserController.toggleStatus);
router.post('/:id/reset-password', SuperAdminUserController.resetPassword);
router.delete('/:id', SuperAdminUserController.delete);

export default router;
