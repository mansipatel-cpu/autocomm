import { Router } from 'express';

const router = Router();

// ----------------- Google Workspace / Sheets -----------------
router.get('/google/status', (_req, res) => {
  res.json({
    connected: false,
    email: null,
  });
});

router.get('/google/sheets', (_req, res) => {
  res.json([]);
});

router.get('/google/sheets/:sheetId/tabs', (_req, res) => {
  res.json([]);
});

router.get('/google/auth', (_req, res) => {
  res.json({
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
  });
});

router.delete('/google/disconnect', (_req, res) => {
  res.json({ success: true, message: 'Google account disconnected' });
});

router.post('/google/exchange', (_req, res) => {
  res.json({ success: true, message: 'Google authentication completed' });
});

export default router;
