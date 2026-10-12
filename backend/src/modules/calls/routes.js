import { Router } from 'express';
import { CallController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', CallController.listCalls);
router.post('/test-call', CallController.createTestCall);
router.get('/:id', CallController.getCall);

export default router;
