import { Router } from 'express';
import { ChannelController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ChannelController.list);
router.post('/', ChannelController.create);
router.get('/:id', ChannelController.getById);
router.post('/:id/test-message', ChannelController.sendTestMessage);
router.put('/:id/profile', ChannelController.updateBusinessProfile);
router.post('/:id/display-name-request', ChannelController.requestDisplayName);
router.post('/:id/disconnect', ChannelController.disconnect);
router.delete('/:id', ChannelController.delete);
router.post('/:id/resubscribe-webhooks', ChannelController.resubscribeWebhooks);

export default router;
