import { Router } from 'express';

const router = Router();

// In-memory notifications store
let notifications = [];

// GET notifications list
router.get('/', (_req, res) => {
  res.json(notifications);
});

// GET unread notifications count
router.get('/unread-count', (_req, res) => {
  const count = notifications.filter((n) => !n.read).length;
  res.json({ count });
});

// PATCH mark notification as read
router.patch('/:id/read', (req, res) => {
  const notif = notifications.find((n) => String(n.id) === String(req.params.id));
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// POST mark all notifications as read
router.post('/read-all', (_req, res) => {
  notifications.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true });
});

// DELETE single notification
router.delete('/:id', (req, res) => {
  notifications = notifications.filter((n) => String(n.id) !== String(req.params.id));
  res.json({ success: true });
});

export default router;
