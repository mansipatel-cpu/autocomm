import { Router } from 'express';
import { SuperAdminIncomingController } from './superadmin-incoming.controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', SuperAdminIncomingController.list);
router.post('/', SuperAdminIncomingController.create);
router.put('/:id', SuperAdminIncomingController.update);
router.put('/:id/assign', SuperAdminIncomingController.assign);
router.patch('/:id/status', SuperAdminIncomingController.toggleStatus);
router.get('/:id/logs', SuperAdminIncomingController.getLogs);
router.delete('/:id', SuperAdminIncomingController.delete);

export default router;
