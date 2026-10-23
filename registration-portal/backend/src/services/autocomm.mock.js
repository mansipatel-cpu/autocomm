import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Mock AutoComm API Service
 * Rule 4: Provide a mock mode (MOCK_AUTOCOMM=true) that fakes AutoComm responses
 * so the page can be tested before the real keys are added.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class AutoCommMockService {
  /**
   * Step 3a: Create contact
   */
  static async createContact({ name, email, phone, company }) {
    await delay(180);
    const contactId = `cnt_${crypto.randomBytes(8).toString('hex')}`;
    logger.info(`[MOCK AutoComm] Contact created for phone ${phone}`, { contactId, name });

    return {
      success: true,
      data: {
        id: contactId,
        _id: contactId,
        name,
        email,
        phone,
        company,
        status: 'Active',
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Step 3b: Add contact to group
   */
  static async addContactToGroup({ contactId, groupId }) {
    await delay(150);
    logger.info(`[MOCK AutoComm] Contact ${contactId} added to group ${groupId}`);

    return {
      success: true,
      data: {
        message: 'Contact added to group successfully',
        contactId,
        groupId,
        addedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Step 3c: Trigger WhatsApp template message or add to WhatsApp campaign
   */
  static async triggerWhatsAppMessage({ phone, templateName, waCampaignId, contactId, name }) {
    await delay(200);
    const messageId = `wamid_${crypto.randomBytes(12).toString('hex')}`;
    logger.info(`[MOCK AutoComm] WhatsApp template '${templateName}' queued for ${phone}`, { messageId, waCampaignId });

    return {
      success: true,
      data: {
        messageId,
        whatsappMessageId: messageId,
        contactId,
        phone,
        status: 'sent',
        templateName: templateName || 'registration_welcome',
        queuedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Step 3d: Trigger Auto Calling campaign
   */
  static async triggerAutoCall({ phone, name, email, callCampaignId }) {
    await delay(250);
    const callRecipientId = `call_${crypto.randomBytes(8).toString('hex')}`;
    logger.info(`[MOCK AutoComm] Contact queued in Auto Calling campaign ${callCampaignId} for ${phone}`, { callRecipientId });

    return {
      success: true,
      data: {
        callRecipientId,
        id: callRecipientId,
        campaignId: callCampaignId || 'CMP-DEFAULT-VC',
        phone,
        name,
        status: 'queued',
        scheduledAt: new Date().toISOString(),
      },
    };
  }
}
