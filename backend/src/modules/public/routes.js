import { Router } from 'express';
import { query } from '../../config/postgres.js';

const router = Router();

// Public analytics scripts for website injection
router.get('/analytics-scripts', async (_req, res) => {
  try {
    const result = await query(
      `SELECT * FROM analytics_scripts WHERE enabled = true ORDER BY load_priority DESC`
    );

    const sortedScripts = (result.rows || []).map((script) => ({
      id: script.id,
      name: script.name,
      type: script.type,
      code: script.code,
      headCode: script.head_code,
      bodyCode: script.body_code,
      placement: script.placement || ['head'],
      loadPriority: script.load_priority || 0,
      async: script.async,
      defer: script.defer,
      hideOnInternalPages: script.hide_on_internal_pages,
      updatedAt: script.updated_at,
    }));

    res.setHeader('Cache-Control', 'no-cache');
    res.json(sortedScripts);
  } catch (error) {
    console.error('Error fetching public analytics scripts:', error);
    res.status(500).json({ error: 'Failed to fetch analytics scripts' });
  }
});

// Public SEO Settings
router.get('/seo', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      defaultTitle: 'AutoComm - AI-Powered Omnichannel Platform',
      defaultDescription: 'Autonomous AI voice and messaging communication platform.',
      defaultKeywords: ['AutoComm', 'AI', 'Omnichannel', 'Voice AI'],
      canonicalBaseUrl: 'http://localhost:5173',
      defaultOgImage: null,
      twitterHandle: null,
      facebookAppId: null,
      googleVerification: null,
      bingVerification: null,
    });
  } catch (error) {
    console.error('Error fetching public SEO settings:', error);
    res.status(500).json({ error: 'Failed to fetch SEO settings' });
  }
});

// Public Platform Languages
router.get('/platform-languages', async (_req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error fetching platform languages:', error);
    res.status(500).json({ error: 'Failed to fetch platform languages' });
  }
});

// Public Settings
router.get('/settings/public', async (_req, res) => {
  res.json({
    system_timezone: 'UTC',
    app_name: 'AutoComm',
    allow_registration: true,
  });
});

// Voice Engine Settings
router.get('/voice-engine', async (_req, res) => {
  res.json({
    plivo_openai_engine_enabled: true,
    twilio_openai_engine_enabled: true,
    custom_voice_engine_enabled: true,
  });
});

export default router;
