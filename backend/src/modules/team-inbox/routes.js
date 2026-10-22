import { Router } from 'express';
import { TeamInboxController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Pins & counts for WhatsApp / Inbox UI
router.get('/pins', (_req, res) => res.json({ pins: [] }));
router.get('/conversations/pins', (_req, res) => res.json({ pins: [] }));
router.get('/unread-count', (_req, res) => res.json({ count: 0 }));
router.get('/conversations/unread-count', (_req, res) => res.json({ count: 0 }));

router.post(['/:id/pin', '/conversations/:id/pin'], (_req, res) => res.json({ success: true }));
router.delete(['/:id/pin', '/conversations/:id/pin'], (_req, res) => res.json({ success: true }));

// Conversations list
router.get('/', TeamInboxController.listConversations);
router.get('/conversations', TeamInboxController.listConversations);

// Single conversation & messages
router.get('/:id', TeamInboxController.getConversation);
router.get('/conversations/:id', TeamInboxController.getConversation);

router.get('/:id/messages', TeamInboxController.getMessages);
router.get('/conversations/:id/messages', TeamInboxController.getMessages);

router.post('/:id/messages', TeamInboxController.sendMessage);
router.post('/conversations/:id/messages', TeamInboxController.sendMessage);

// Conversation management
router.put('/:id/read', TeamInboxController.markAsRead);
router.put('/conversations/:id/read', TeamInboxController.markAsRead);

router.put('/:id/status', TeamInboxController.updateStatus);
router.patch('/:id/status', TeamInboxController.updateStatus);
router.put('/conversations/:id/status', TeamInboxController.updateStatus);
router.patch('/conversations/:id/status', TeamInboxController.updateStatus);

router.put('/:id/assign', TeamInboxController.assignAgent);
router.put('/conversations/:id/assign', TeamInboxController.assignAgent);

router.put('/:id/block', TeamInboxController.toggleBlock);
router.put('/conversations/:id/block', TeamInboxController.toggleBlock);

router.delete(['/:id', '/conversations/:id'], (_req, res) => res.json({ success: true }));

export default router;
