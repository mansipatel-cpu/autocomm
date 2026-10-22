import { Router } from 'express';

const router = Router();

// In-memory or default branding settings
let brandingState = {
  app_name: 'AutoComm',
  app_tagline: 'Omnichannel AI Communication Platform',
  logo_url: null,
  logo_url_light: null,
  logo_url_dark: null,
  favicon_url: null,
  admin_email: 'support@autocomm.ai',
  app_location: 'Global',
  social_twitter_url: null,
  social_linkedin_url: null,
  social_github_url: null,
  theme_primary: null,
  theme_primary_foreground: null,
  theme_accent: null,
  theme_background: null,
  theme_sidebar: null,
  theme_website_accent: null,
  theme_website_foreground: null,
};

// GET branding
router.get('/', (_req, res) => {
  res.json(brandingState);
});

// PATCH branding (Admin updates)
router.patch('/', (req, res) => {
  brandingState = { ...brandingState, ...(req.body || {}) };
  res.json({ success: true, branding: brandingState });
});

// DELETE branding assets
router.delete('/logo-light', (_req, res) => {
  brandingState.logo_url_light = null;
  res.json({ success: true, branding: brandingState });
});

router.delete('/logo-dark', (_req, res) => {
  brandingState.logo_url_dark = null;
  res.json({ success: true, branding: brandingState });
});

router.delete('/favicon', (_req, res) => {
  brandingState.favicon_url = null;
  res.json({ success: true, branding: brandingState });
});

// POST branding uploads
router.post('/upload-logo-light', (req, res) => {
  const url = req.body?.url || '/logo.png';
  brandingState.logo_url_light = url;
  res.json({ success: true, url, branding: brandingState });
});

router.post('/upload-logo-dark', (req, res) => {
  const url = req.body?.url || '/logo.png';
  brandingState.logo_url_dark = url;
  res.json({ success: true, url, branding: brandingState });
});

router.post('/upload-favicon', (req, res) => {
  const url = req.body?.url || '/favicon.ico';
  brandingState.favicon_url = url;
  res.json({ success: true, url, branding: brandingState });
});

export default router;
