import { Router } from 'express';
import { ApiKeyController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ApiKeyController.listKeys);
router.post('/', ApiKeyController.createKey);
router.delete('/:id', ApiKeyController.revokeKey);

export default router;
