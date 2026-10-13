import { Router } from 'express';
import { ClientController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', ClientController.list);
router.post('/', ClientController.create);
router.get('/:id', ClientController.getById);
router.put('/:id', ClientController.update);
router.patch('/:id/status', ClientController.updateStatus);
router.post('/:id/reset-password', ClientController.resetPassword);
router.post('/:id/resend-credentials', ClientController.resendCredentials);
router.put('/:id/credits', ClientController.manageCredits);
router.put('/:id/phone-numbers', ClientController.managePhoneNumbers);
router.delete('/:id', ClientController.delete);

export default router;
