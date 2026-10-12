import { Router } from 'express';
import { PhoneNumberController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', PhoneNumberController.listNumbers);
router.post('/', PhoneNumberController.allocateNumber);
router.put('/:id/assign-agent', PhoneNumberController.assignAgent);
router.delete('/:id', PhoneNumberController.releaseNumber);

export default router;
