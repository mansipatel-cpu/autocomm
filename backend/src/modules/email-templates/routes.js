import { Router } from 'express';
import { EmailTemplateController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', EmailTemplateController.list);
router.post('/', EmailTemplateController.create);
router.get('/:id', EmailTemplateController.getById);
router.put('/:id', EmailTemplateController.update);
router.patch('/:id/status', EmailTemplateController.toggleStatus);
router.post('/:id/preview', EmailTemplateController.preview);
router.post('/:id/test', EmailTemplateController.testEmail);

export default router;
