import { Router } from 'express';
import { CrmController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/pipeline', CrmController.getPipeline);
router.post('/leads', CrmController.createLead);
router.put('/leads/:id', CrmController.updateLead);
router.put('/leads/:id/stage', CrmController.updateStage);
router.delete('/leads/:id', CrmController.deleteLead);

export default router;
