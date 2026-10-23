import { RegistrationRepository } from '../db/registration.repository.js';
import { AutoCommService } from './autocomm.service.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { isValidE164 } from '../utils/phone.js';

export class RegistrationService {
  /**
   * Main registration pipeline (POST /api/register)
   */
  static async registerUser({ fullName, email, phone, company, consent }) {
    // 1. Validation & Consent
    if (!consent) {
      throw new Error('Consent to receive WhatsApp messages and automated calls is required.');
    }

    if (!fullName || !fullName.trim()) {
      throw new Error('Full Name is required.');
    }

    if (!email || !email.trim() || !email.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    const cleanPhone = (phone || '').trim();
    if (!isValidE164(cleanPhone)) {
      throw new Error(`Phone number must follow E.164 international format (e.g. +14155552671). Received: ${cleanPhone}`);
    }

    // Duplicate check by phone number
    const existing = RegistrationRepository.findByPhone(cleanPhone);
    if (existing) {
      throw new Error(`A registration with phone number '${cleanPhone}' already exists.`);
    }

    // 2. Save user locally with status "registered" and consent timestamp
    const consentTimestamp = new Date().toISOString();
    const registration = RegistrationRepository.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      company: company ? company.trim() : null,
      consent: true,
      consentTimestamp,
    });

    logger.info(`Saved local registration ID #${registration.id} for phone ${cleanPhone}`);

    // 3. Trigger AutoComm integration pipeline (Fault-tolerant)
    return this.executeAutoCommPipeline(registration.id);
  }

  /**
   * Runs steps 3a, 3b, 3c, 3d with per-step error boundary and status tracking
   */
  static async executeAutoCommPipeline(registrationId) {
    let reg = RegistrationRepository.findById(registrationId);
    if (!reg) {
      throw new Error(`Registration #${registrationId} not found.`);
    }

    RegistrationRepository.update(registrationId, { status: 'in_progress' });

    // Step 3a: Create Contact in AutoComm
    let contactId = reg.autocomm_contact_id;
    if (!contactId || reg.contact_status !== 'contact_created') {
      try {
        const contactRes = await AutoCommService.createContact({
          name: reg.full_name,
          email: reg.email,
          phone: reg.phone,
          company: reg.company,
          groupIds: config.autocomm.groupId ? [config.autocomm.groupId] : [],
        });

        contactId = contactRes?.data?.id || `cnt_${reg.id}`;
        reg = RegistrationRepository.update(registrationId, {
          contact_status: 'contact_created',
          autocomm_contact_id: String(contactId),
        });
      } catch (err) {
        logger.error(`Step 3a (create contact) failed for registration #${registrationId}: ${err.message}`);
        reg = RegistrationRepository.update(registrationId, {
          status: 'failed',
          contact_status: 'failed',
          last_error: `Contact creation failed: ${err.message}`,
          last_failed_step: 'contact',
        });
        // Stop pipeline here if contact creation failed; can retry later
        return reg;
      }
    }

    // Step 3b: Add contact to group AUTOCOMM_GROUP_ID
    if (config.autocomm.groupId) {
      try {
        await AutoCommService.addContactToGroup({
          contactId,
          groupId: config.autocomm.groupId,
        });
      } catch (err) {
        logger.warn(`Step 3b (add to group) notice for registration #${registrationId}: ${err.message}`);
        // Non-blocking warning: continues to message and call trigger
      }
    }

    // Step 3c: Trigger WhatsApp message (approved template or WhatsApp campaign)
    const canSkipMessage = ['message_queued', 'sent', 'delivered'].includes(reg.message_status);
    if (!canSkipMessage) {
      try {
        const waRes = await AutoCommService.triggerWhatsAppMessage({
          phone: reg.phone,
          templateName: config.autocomm.templateName,
          waCampaignId: config.autocomm.waCampaignId,
          contactId,
          name: reg.full_name,
        });

        const messageId = waRes?.data?.messageId || waRes?.data?.id || `msg_${reg.id}`;
        reg = RegistrationRepository.update(registrationId, {
          message_status: 'message_queued',
          autocomm_message_id: String(messageId),
        });
      } catch (err) {
        logger.error(`Step 3c (WhatsApp message) failed for registration #${registrationId}: ${err.message}`);
        reg = RegistrationRepository.update(registrationId, {
          status: 'failed',
          message_status: 'failed',
          last_error: `WhatsApp trigger failed: ${err.message}`,
          last_failed_step: 'message',
        });
        // Stop or continue to call? Prompt allows retrying failed steps. Let's try calling too or save error.
      }
    }

    // Step 3d: Trigger Auto Calling campaign
    const canSkipCall = ['call_queued', 'initiated', 'completed'].includes(reg.call_status);
    if (!canSkipCall) {
      try {
        const callRes = await AutoCommService.triggerAutoCall({
          phone: reg.phone,
          name: reg.full_name,
          email: reg.email,
          callCampaignId: config.autocomm.callCampaignId,
        });

        const callRecipientId = callRes?.data?.callRecipientId || callRes?.data?.id || `call_${reg.id}`;
        reg = RegistrationRepository.update(registrationId, {
          call_status: 'call_queued',
          autocomm_call_id: String(callRecipientId),
        });
      } catch (err) {
        logger.error(`Step 3d (Auto Call) failed for registration #${registrationId}: ${err.message}`);
        reg = RegistrationRepository.update(registrationId, {
          status: 'failed',
          call_status: 'failed',
          last_error: `Auto Call trigger failed: ${err.message}`,
          last_failed_step: 'call',
        });
      }
    }

    // Check overall final status
    const allSuccessful =
      reg.contact_status === 'contact_created' &&
      ['message_queued', 'sent', 'delivered'].includes(reg.message_status) &&
      ['call_queued', 'initiated', 'completed'].includes(reg.call_status);

    if (allSuccessful) {
      reg = RegistrationRepository.update(registrationId, {
        status: 'completed',
        last_error: null,
        last_failed_step: null,
      });
    }

    return reg;
  }

  /**
   * Retry failed steps for an existing registration (Step 6)
   */
  static async retryRegistration(registrationId) {
    const reg = RegistrationRepository.findById(registrationId);
    if (!reg) {
      throw new Error(`Registration #${registrationId} not found.`);
    }

    logger.info(`Retrying registration #${registrationId} (current attempt #${(reg.retry_count || 0) + 1})`);
    RegistrationRepository.update(registrationId, {
      retry_count: (reg.retry_count || 0) + 1,
      last_error: null,
    });

    return this.executeAutoCommPipeline(registrationId);
  }
}
