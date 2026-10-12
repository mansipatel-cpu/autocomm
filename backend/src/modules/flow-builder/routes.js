import { Router } from 'express';
import { FlowBuilderController } from './controller.js';
import { authenticateSuperAdmin } from '../../common/middlewares/superadmin-auth.middleware.js';

const router = Router();

router.use(authenticateSuperAdmin);

router.get('/', FlowBuilderController.listFlows);
router.post('/', FlowBuilderController.createFlow);
router.get('/:id', FlowBuilderController.getFlow);
router.put('/:id', FlowBuilderController.updateFlow);
router.put('/:id/assign', FlowBuilderController.assignToClient);
router.delete('/:id', FlowBuilderController.deleteFlow);

export default router;
