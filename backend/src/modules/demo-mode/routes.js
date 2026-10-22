import { Router } from 'express';

const router = Router();

// GET demo mode status
router.get('/status', (_req, res) => {
  res.json({
    enabled: false,
    message: '',
  });
});

export default router;
