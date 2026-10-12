import { Router } from 'express';
import { Channel } from '../modules/channels/model.js';
import { TeamInboxService } from '../modules/team-inbox/service.js';
import { Message } from '../modules/team-inbox/model.js';
import { CampaignRecipient } from '../modules/campaigns/model.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * Meta Webhook verification handshake
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = env.META_WEBHOOK_VERIFY_TOKEN || 'autocomm_meta_secret_token';

  if (mode === 'subscribe' && token === expectedToken) {
    logger.info('Meta WhatsApp Webhook subscription verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn(`Meta Webhook verification mismatch: mode=${mode}`);
  return res.status(403).send('Forbidden');
});

/**
 * Meta Webhook incoming events
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          const phoneNumberId = value.metadata?.phone_number_id;

          // 1. Handle Message Status Updates (delivered, read, sent, failed)
          if (value.statuses && value.statuses.length > 0) {
            for (const statusObj of value.statuses) {
              const metaMsgId = statusObj.id;
              const statusStr = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

              // Update in TeamInbox messages
              await Message.updateMany(
                { metaMessageId: metaMsgId },
                { $set: { status: statusStr } }
              );

              // Update in CampaignRecipient if applicable
              await CampaignRecipient.updateMany(
                { messageId: metaMsgId },
                { $set: { status: statusStr } }
              );
            }
          }

          // 2. Handle Inbound Messages
          if (value.messages && value.messages.length > 0) {
            // Find tenant channel by phone_number_id
            let channel = null;
            if (phoneNumberId) {
              channel = await Channel.findOne({ phoneNumberId });
            }

            // Fallback: if not found by exact phoneNumberId, look up first active channel or default
            if (!channel) {
              channel = await Channel.findOne({ status: 'ACTIVE' });
            }

            if (!channel) {
              logger.warn(`No active channel found for inbound WhatsApp message from ${phoneNumberId}`);
              continue;
            }

            const contactObj = value.contacts?.[0] || {};
            const contactName = contactObj.profile?.name || 'Customer';

            for (const msg of value.messages) {
              const fromNumber = msg.from;
              let textContent = '';

              if (msg.type === 'text') {
                textContent = msg.text?.body || '';
              } else if (msg.type === 'interactive') {
                textContent = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive Reply]';
              } else if (msg.type === 'button') {
                textContent = msg.button?.text || '[Button Click]';
              } else {
                textContent = `[${msg.type.toUpperCase()} Attachment]`;
              }

              await TeamInboxService.handleInboundMessage(channel.clientId, {
                contactPhoneNumber: fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`,
                contactName,
                text: textContent,
                source: 'WA',
                metaMessageId: msg.id,
              });
            }
          }
        }
      }
    }

    // Acknowledge receipt to Meta immediately with 200 OK
    return res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    logger.error(`Error processing WhatsApp webhook: ${err.message}`);
    return res.status(200).send('EVENT_RECEIVED'); // Meta expects 200 to prevent retrying
  }
});

export default router;
