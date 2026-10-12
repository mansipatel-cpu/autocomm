import { Router } from 'express';
import { EmailTemplateController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', EmailTemplateController.list);
router.get('/:id', EmailTemplateController.getById);
router.put('/:id', EmailTemplateController.update);
router.post('/:id/test', EmailTemplateController.testEmail);

export default router;
