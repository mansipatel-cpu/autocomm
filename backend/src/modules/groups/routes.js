import { Router } from 'express';
import { GroupController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', GroupController.list);
router.post('/', GroupController.create);
router.get('/:id/members', GroupController.getMembers);
router.delete('/:id', GroupController.delete);

export default router;
