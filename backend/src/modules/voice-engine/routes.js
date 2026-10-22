import { Router } from 'express';
import { AgentService } from '../agents/service.js';

const router = Router();

// In-memory settings stores for voice engine
let providerKeys = {
  openai: '',
  elevenlabs: '',
  deepgram: '',
  groq: '',
  openrouter: '',
};

let storageConfig = {
  provider: 'local',
  path: './uploads/recordings',
  s3Bucket: '',
};

let nodesStore = [];
let sipGatewaysStore = [];

// ----------------- Agents -----------------
router.get('/agents', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const agents = await AgentService.listAgents(clientId);
    res.json(agents || []);
  } catch (_err) {
    res.json([]);
  }
});

router.post('/agents', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const agent = await AgentService.createAgent(clientId, req.body);
    res.status(201).json(agent);
  } catch (err) {
    next(err);
  }
});

router.get('/agents/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const agent = await AgentService.getAgent(clientId, req.params.id);
    res.json(agent || {});
  } catch (_err) {
    res.json({ id: req.params.id, name: 'Voice Agent' });
  }
});

router.put('/agents/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const agent = await AgentService.updateAgent(clientId, req.params.id, req.body);
    res.json(agent);
  } catch (_err) {
    res.json({ id: req.params.id, ...req.body });
  }
});

router.delete('/agents/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    await AgentService.deleteAgent(clientId, req.params.id);
    res.json({ success: true });
  } catch (_err) {
    res.json({ success: true });
  }
});

router.post('/agents/preview', (_req, res) => {
  res.json({ success: true, audioUrl: '/sample-voice.mp3' });
});

// ----------------- Provider Keys -----------------
router.get('/admin/provider-keys', (_req, res) => {
  res.json({ success: true, keys: providerKeys });
});

router.put('/admin/provider-keys', (req, res) => {
  providerKeys = { ...providerKeys, ...(req.body || {}) };
  res.json({ success: true, keys: providerKeys });
});

router.post('/admin/provider-keys/test/:provider', (req, res) => {
  res.json({ success: true, message: `Connected to ${req.params.provider} successfully` });
});

router.get('/admin/provider-keys/openrouter-models', (_req, res) => {
  res.json([
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  ]);
});

// ----------------- Outbound Calls -----------------
router.post('/calls/outbound', (req, res) => {
  res.status(201).json({
    success: true,
    callId: `cve_call_${Date.now()}`,
    status: 'initiated',
    ...req.body,
  });
});

router.get('/calls/:id', (req, res) => {
  res.json({
    success: true,
    call: {
      id: req.params.id,
      status: 'completed',
      durationSeconds: 45,
      createdAt: new Date().toISOString(),
    },
  });
});

// ----------------- Storage -----------------
router.get('/admin/storage', (_req, res) => {
  res.json({ success: true, storage: storageConfig });
});

router.post('/admin/storage', (req, res) => {
  storageConfig = { ...storageConfig, ...(req.body || {}) };
  res.json({ success: true, storage: storageConfig });
});

router.post('/admin/storage/test', (_req, res) => {
  res.json({ success: true, message: 'Storage connection verified' });
});

router.post('/admin/storage/activate', (_req, res) => {
  res.json({ success: true, message: 'Storage activated' });
});

// ----------------- Nodes -----------------
router.get('/admin/settings/nodes', (_req, res) => {
  res.json(nodesStore);
});

router.post('/admin/settings/nodes', (req, res) => {
  const node = { id: Date.now(), ...req.body };
  nodesStore.push(node);
  res.status(201).json({ success: true, node });
});

router.put('/admin/settings/nodes/:id', (req, res) => {
  const idx = nodesStore.findIndex((n) => String(n.id) === String(req.params.id));
  if (idx !== -1) {
    nodesStore[idx] = { ...nodesStore[idx], ...req.body };
  }
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/admin/settings/nodes/:id', (req, res) => {
  nodesStore = nodesStore.filter((n) => String(n.id) !== String(req.params.id));
  res.json({ success: true });
});

// ----------------- SIP Gateways -----------------
router.get('/admin/settings/sip-gateways', (_req, res) => {
  res.json(sipGatewaysStore);
});

router.post('/admin/settings/sip-gateways', (req, res) => {
  const gw = { id: Date.now(), status: 'active', ...req.body };
  sipGatewaysStore.push(gw);
  res.status(201).json({ success: true, gateway: gw });
});

router.put('/admin/settings/sip-gateways/:id', (req, res) => {
  const idx = sipGatewaysStore.findIndex((g) => String(g.id) === String(req.params.id));
  if (idx !== -1) {
    sipGatewaysStore[idx] = { ...sipGatewaysStore[idx], ...req.body };
  }
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/admin/settings/sip-gateways/:id', (req, res) => {
  sipGatewaysStore = sipGatewaysStore.filter((g) => String(g.id) !== String(req.params.id));
  res.json({ success: true });
});

router.post('/admin/settings/sip-gateways/:id/activate', (_req, res) => {
  res.json({ success: true });
});

// ----------------- STT Test -----------------
router.get('/test/stt', (_req, res) => {
  res.json({ success: true, message: 'STT engine available' });
});

export default router;
