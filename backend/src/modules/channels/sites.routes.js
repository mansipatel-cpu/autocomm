import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Site storage for WhatsApp chatbot / AI widget builder
const channelSites = new Map();
const siteTrainingQa = new Map();
const siteTrainingSources = new Map();

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

router.get('/sites', (_req, res) => {
  return res.json(Array.from(channelSites.values()));
});

router.post('/sites', (req, res) => {
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
  return res.status(201).json(site);
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

router.patch('/sites/:id', (req, res) => {
  const siteId = String(req.params.id);
  for (const [chId, site] of channelSites.entries()) {
    if (site.id === siteId || String(chId) === siteId) {
      const updated = { ...site, ...(req.body || {}) };
      channelSites.set(chId, updated);
      return res.json(updated);
    }
  }
  return res.json({ id: siteId, ...(req.body || {}) });
});

// ----------------- Training QA -----------------
router.get('/training/:siteId/qa', (req, res) => {
  const list = siteTrainingQa.get(String(req.params.siteId)) || [];
  return res.json(list);
});

router.post('/training/:siteId/qa', (req, res) => {
  const siteId = String(req.params.siteId);
  const list = siteTrainingQa.get(siteId) || [];
  const qa = {
    id: `qa_${Date.now()}`,
    siteId,
    question: req.body?.question || '',
    answer: req.body?.answer || '',
    isActive: req.body?.isActive !== false,
    createdAt: new Date().toISOString(),
  };
  list.push(qa);
  siteTrainingQa.set(siteId, list);
  return res.status(201).json(qa);
});

router.put('/training/qa/:qaId', (req, res) => {
  return res.json({ success: true, id: req.params.qaId, ...(req.body || {}) });
});

router.delete('/training/qa/:qaId', (req, res) => {
  const qaId = String(req.params.qaId);
  for (const [siteId, list] of siteTrainingQa.entries()) {
    siteTrainingQa.set(
      siteId,
      list.filter((q) => q.id !== qaId)
    );
  }
  return res.json({ success: true });
});

// ----------------- Training Sources -----------------
router.get('/training/:siteId/sources', (req, res) => {
  const list = siteTrainingSources.get(String(req.params.siteId)) || [];
  return res.json(list);
});

router.post('/training/:siteId/url', (req, res) => {
  const siteId = String(req.params.siteId);
  const list = siteTrainingSources.get(siteId) || [];
  const source = {
    id: `src_${Date.now()}`,
    siteId,
    type: 'url',
    url: req.body?.url || '',
    status: 'indexed',
    createdAt: new Date().toISOString(),
  };
  list.push(source);
  siteTrainingSources.set(siteId, list);
  return res.status(201).json(source);
});

router.post('/training/:siteId/document', (req, res) => {
  const siteId = String(req.params.siteId);
  const list = siteTrainingSources.get(siteId) || [];
  const source = {
    id: `doc_${Date.now()}`,
    siteId,
    type: 'document',
    filename: req.body?.filename || 'document.pdf',
    status: 'indexed',
    createdAt: new Date().toISOString(),
  };
  list.push(source);
  siteTrainingSources.set(siteId, list);
  return res.status(201).json(source);
});

router.delete('/training/source/:sourceId', (req, res) => {
  const sourceId = String(req.params.sourceId);
  for (const [siteId, list] of siteTrainingSources.entries()) {
    siteTrainingSources.set(
      siteId,
      list.filter((s) => s.id !== sourceId)
    );
  }
  return res.json({ success: true });
});

router.post('/training/source/:sourceId/reprocess', (_req, res) => {
  return res.json({ success: true, status: 'reprocessed' });
});

router.get('/training/:siteId/preview', (_req, res) => {
  return res.json({
    sources: [],
    totalTokens: 0,
    summary: 'Knowledge base is ready for AI generation.',
  });
});

router.get('/training/:siteId/stats', (req, res) => {
  const siteId = String(req.params.siteId);
  const qaCount = (siteTrainingQa.get(siteId) || []).length;
  const sourcesCount = (siteTrainingSources.get(siteId) || []).length;
  return res.json({
    qaCount,
    sourcesCount,
    totalDocuments: sourcesCount,
  });
});

router.get('/widget/kb/:siteId', (_req, res) => {
  return res.json({ kbList: [] });
});

router.post('/training/:siteId/kb-sync', (_req, res) => {
  return res.json({ success: true, message: 'KB synced successfully' });
});

router.post('/training/:siteId/test-chat', (req, res) => {
  const message = req.body?.message || '';
  return res.json({
    success: true,
    reply: `Thank you for contacting us! Regarding "${message}", our AI assistant is ready to help.`,
  });
});

router.post('/widget/upload-logo', (_req, res) => {
  return res.json({
    success: true,
    url: '/logo.png',
  });
});

export default router;
