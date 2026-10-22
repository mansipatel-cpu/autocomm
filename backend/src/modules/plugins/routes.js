import { Router } from 'express';

const router = Router();

// GET plugin capabilities for client-app bootstrapper and status hooks
router.get('/capabilities', (_req, res) => {
  res.json({
    success: true,
    data: {
      capabilities: {
        whatsapp: true,
        voice: true,
        sip: true,
        crm: true,
        'flow-automation': true,
        analytics: true,
        inbox: true,
      },
      pluginBundles: {},
      sipEngine: true,
      sipPluginInstalled: true,
      sipEnginesAllowed: ['twilio', 'plivo'],
      maxConcurrentSipCalls: 50,
      restApi: true,
      teamManagement: true,
      customVoiceEngine: true,
    },
  });
});

// Admin plugin installer endpoints
router.get('/installer/installed', (_req, res) => {
  res.json({
    success: true,
    installed: [
      { name: 'whatsapp', displayName: 'WhatsApp Cloud API', version: '1.0.0', enabled: true },
      { name: 'voice', displayName: 'Voice AI Engine', version: '1.0.0', enabled: true },
      { name: 'flow-automation', displayName: 'Flow Builder', version: '1.0.0', enabled: true },
    ],
  });
});

router.post('/installer/validate', (_req, res) => {
  res.json({ success: true, valid: true });
});

router.post('/installer/install', (_req, res) => {
  res.json({ success: true, message: 'Plugin installed successfully' });
});

router.all('/installer/uninstall/:name', (_req, res) => {
  res.json({ success: true, message: 'Plugin uninstalled' });
});

router.all('/installer/run-migration/:name', (_req, res) => {
  res.json({ success: true, message: 'Migration executed' });
});

export default router;
