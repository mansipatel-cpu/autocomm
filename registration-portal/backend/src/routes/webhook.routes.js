import { Router } from 'express';
import { config } from '../config/env.js';
import { RegistrationRepository } from '../db/registration.repository.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/webhooks/autocomm
 * Receives delivery and call-status updates from AutoComm
 * Verifies shared secret header
 */
router.post('/autocomm', (req, res) => {
  const secretHeader = req.headers['x-webhook-secret'] || req.headers['x-secret'];
  const authHeader = req.headers.authorization;

  let providedSecret = secretHeader;
  if (!providedSecret && authHeader && authHeader.startsWith('Bearer ')) {
    providedSecret = authHeader.slice(7).trim();
  }

  // Verify shared secret header
  if (!providedSecret || providedSecret !== config.webhook.secret) {
    logger.warn('Unauthorized webhook call received (secret mismatch)');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid webhook secret header.',
    });
  }

  const payload = req.body || {};
  const { event, type, phone, messageId, callId, status, error } = payload;

  logger.info(`Received AutoComm webhook event: ${event || type || 'status_update'}`);

  let registration = null;

  // Locate registration row by phone or AutoComm response IDs
  if (phone) {
    registration = RegistrationRepository.findByPhone(phone);
  }

  if (!registration && messageId) {
    const list = RegistrationRepository.list({ limit: 1000 });
    registration = list.rows.find((r) => r.autocomm_message_id === messageId);
  }

  if (!registration && callId) {
    const list = RegistrationRepository.list({ limit: 1000 });
    registration = list.rows.find((r) => r.autocomm_call_id === callId);
  }

  if (!registration) {
    logger.warn('Webhook received but matching registration record not found', { phone, messageId, callId });
    RegistrationRepository.logWebhook({
      eventType: event || type || 'unknown',
      rawPayload: payload,
      status: 'unmatched',
    });

    return res.json({
      success: true,
      data: {
        received: true,
        matched: false,
        note: 'Payload logged but registration record was not found.',
      },
    });
  }

  const updates = {};
  const normalizedStatus = (status || '').toLowerCase();

  // Message status updates: sent, delivered, read, failed
  if (type === 'message' || event?.startsWith('message.') || messageId) {
    if (['sent', 'delivered', 'read', 'failed'].includes(normalizedStatus)) {
      updates.message_status = normalizedStatus;
    }
  }

  // Call status updates: initiated, completed, failed
  if (type === 'call' || event?.startsWith('call.') || callId) {
    if (['initiated', 'completed', 'failed'].includes(normalizedStatus)) {
      updates.call_status = normalizedStatus;
    }
  }

  if (error) {
    updates.last_error = String(error);
  }

  if (Object.keys(updates).length > 0) {
    const updated = RegistrationRepository.update(registration.id, updates);
    logger.info(`Updated registration #${registration.id} via webhook`, updates);

    RegistrationRepository.logWebhook({
      registrationId: registration.id,
      eventType: event || type || 'status_update',
      rawPayload: payload,
      status: 'processed',
    });

    return res.json({
      success: true,
      data: updated,
    });
  }

  return res.json({
    success: true,
    data: {
      received: true,
      message: 'Webhook processed (no status mutation required)',
    },
  });
});

export default router;
