import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Site storage for WhatsApp chatbot / AI widget builder
const channelSites = new Map();

router.get('/active-site', (req, res) => {
  const { channelId } = req.query;
  if (!channelId) {
    return res.status(400).json({ message: 'channelId query parameter is required' });
  }
  const site = channelSites.get(String(channelId)) || {
    id: `site-${channelId}`,
    channelId: String(channelId),
    name: 'AI Site',
    domain: 'ai-settings.local',
    widgetEnabled: true,
    widgetConfig: {},
    aiTrainingConfig: { trainFromKB: false, trainFromDocuments: true },
  };
  return res.json(site);
});

router.get('/sites', (req, res) => {
  return res.json(Array.from(channelSites.values()));
});

router.post('/sites/create_or_update', (req, res) => {
  const { channelId, name, domain, widgetEnabled, widgetConfig, aiTrainingConfig } = req.body || {};
  const id = `site-${channelId || Date.now()}`;
  const site = {
    id,
    channelId: String(channelId || ''),
    name: name || 'AI Site',
    domain: domain || 'ai-settings.local',
    widgetEnabled: widgetEnabled !== undefined ? widgetEnabled : true,
    widgetConfig: widgetConfig || {},
    aiTrainingConfig: aiTrainingConfig || { trainFromKB: false, trainFromDocuments: true },
  };
  if (channelId) {
    channelSites.set(String(channelId), site);
  }
  return res.json(site);
});

export default router;
