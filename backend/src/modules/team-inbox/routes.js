import { Router } from 'express';
import { TeamInboxController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', TeamInboxController.listConversations);
router.get('/conversations/:id', TeamInboxController.getConversation);
router.get('/conversations/:id/messages', TeamInboxController.getMessages);
router.post('/conversations/:id/messages', TeamInboxController.sendMessage);
router.put('/conversations/:id/read', TeamInboxController.markAsRead);
router.put('/conversations/:id/status', TeamInboxController.updateStatus);
router.put('/conversations/:id/assign', TeamInboxController.assignAgent);
router.put('/conversations/:id/block', TeamInboxController.toggleBlock);

export default router;
