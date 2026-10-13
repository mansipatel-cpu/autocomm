import { Router } from 'express';
import { ChannelController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ChannelController.list);
router.get('/active', ChannelController.getActive);
router.post('/webhook-resubscribe-all', ChannelController.resubscribeAllWebhooks);
router.post('/userid', ChannelController.listByUser);
router.post('/', ChannelController.create);
router.get('/:id', ChannelController.getById);
router.put('/:id', ChannelController.update);
router.post('/:id/test-message', ChannelController.sendTestMessage);
router.post('/:id/disconnect', ChannelController.disconnect);
router.post('/:id/health', ChannelController.checkChannelHealth);
router.get('/:id/webhook-subscription', ChannelController.getWebhookSubscription);
router.post('/:id/webhook-resubscribe', ChannelController.resubscribeWebhook);
router.delete('/:id', ChannelController.delete);

export default router;
