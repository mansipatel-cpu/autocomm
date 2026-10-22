import { Router } from 'express';
import { AgentController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AgentController.listAgents);
router.post('/', AgentController.createAgent);
router.get('/:id', AgentController.getAgent);
router.put('/:id', AgentController.updateAgent);
router.patch('/:id', AgentController.updateAgent);
router.put('/:id/toggle-status', AgentController.toggleStatus);
router.delete('/:id', AgentController.deleteAgent);

export default router;
