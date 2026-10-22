import { Router } from 'express';

const router = Router();

// Subscriptions status
router.get('/', (_req, res) => {
  res.json({
    success: true,
    plan: 'Enterprise Scale',
    status: 'ACTIVE',
    credits: 10000.0,
    features: ['whatsapp', 'voice', 'sip', 'crm', 'flows', 'unlimited_agents'],
    renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

// Plans list
router.get('/plans', (_req, res) => {
  res.json([
    {
      id: 'enterprise',
      name: 'Enterprise Scale',
      price: 0,
      credits: 10000,
      maxAgents: 50,
      features: ['WhatsApp', 'Voice AI', 'Telephony SIP', 'Full CRM'],
    },
  ]);
});

export default router;
