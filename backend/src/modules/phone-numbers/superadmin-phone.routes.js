import { Router } from 'express';
import { SuperAdminPhoneController } from './superadmin-phone.controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', SuperAdminPhoneController.list);
router.post('/', SuperAdminPhoneController.create);
router.get('/:id', SuperAdminPhoneController.getById);
router.put('/:id', SuperAdminPhoneController.update);
router.put('/:id/assign', SuperAdminPhoneController.assign);
router.patch('/:id/status', SuperAdminPhoneController.toggleStatus);
router.delete('/:id', SuperAdminPhoneController.delete);

export default router;
