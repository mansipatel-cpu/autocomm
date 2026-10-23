import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { RegistrationRepository } from '../db/registration.repository.js';
import { RegistrationService } from '../services/registration.service.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/admin/login
 * Validates ADMIN_PASSWORD and returns auth token
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.admin.password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid administrator password.',
    });
  }

  return res.json({
    success: true,
    data: {
      token: config.admin.password,
      message: 'Admin authentication successful',
      isMockMode: config.isMock,
    },
  });
});

/**
 * GET /api/admin/registrations
 * Protected table data for Page 2
 */
router.get('/registrations', requireAdmin, (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = RegistrationRepository.list({
      search,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '50', 10),
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Failed to retrieve admin registrations: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve registrations list.',
    });
  }
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', requireAdmin, (_req, res) => {
  try {
    const stats = RegistrationRepository.getStats();
    return res.json({
      success: true,
      data: {
        ...stats,
        isMockMode: config.isMock,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve portal stats.',
    });
  }
});

/**
 * POST /api/admin/registrations/:id/retry
 * Retries failed steps for a specific registration
 */
router.post('/registrations/:id/retry', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await RegistrationService.retryRegistration(id);

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error(`Retry failed for registration #${req.params.id}: ${error.message}`);
    return res.status(400).json({
      success: false,
      error: error.message || 'Retry failed.',
    });
  }
});

export default router;
