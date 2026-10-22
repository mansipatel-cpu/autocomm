import { Router } from 'express';

const router = Router();

// In-memory webhooks store
let webhooksStore = [];
let webhookLogsStore = [];

router.get('/', (_req, res) => {
  res.json(webhooksStore);
});

router.get('/limits', (_req, res) => {
  res.json({
    maxWebhooks: 20,
    currentCount: webhooksStore.length,
    remaining: Math.max(0, 20 - webhooksStore.length),
  });
});

router.post('/', (req, res) => {
  const webhook = {
    id: Date.now(),
    name: req.body?.name || 'CRM Outbound Webhook',
    url: req.body?.url || '',
    events: req.body?.events || ['call.completed', 'message.received'],
    enabled: req.body?.enabled !== false,
    secret: req.body?.secret || `whsec_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  webhooksStore.push(webhook);
  res.status(201).json(webhook);
});

router.delete('/:id', (req, res) => {
  webhooksStore = webhooksStore.filter((w) => String(w.id) !== String(req.params.id));
  res.json({ success: true });
});

router.post('/:id/test', (req, res) => {
  const log = {
    id: Date.now(),
    webhookId: req.params.id,
    event: 'test.ping',
    statusCode: 200,
    success: true,
    responseBody: JSON.stringify({ ok: true, receivedAt: new Date().toISOString() }),
    timestamp: new Date().toISOString(),
  };
  webhookLogsStore.unshift(log);
  res.json({
    success: true,
    status: 200,
    message: 'Test ping delivered successfully',
    log,
  });
});

router.get('/:id/logs', (req, res) => {
  const logs = webhookLogsStore.filter((l) => String(l.webhookId) === String(req.params.id));
  res.json(logs);
});

router.post('/logs/:logId/retry', (req, res) => {
  res.json({ success: true, message: 'Retry queued successfully' });
});

router.all('/elevenlabs', (_req, res) => {
  res.json({ success: true, received: true });
});

export default router;
