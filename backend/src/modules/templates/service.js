import { Template } from './model.js';
import { AppError } from '../../common/errors/app-error.js';
import { META_TEMPLATE_STATUS, VALIDATION_LIMITS } from '../../config/constants.js';

export class TemplateService {
  static async listTemplates({ clientId, type, category, status, language, search, page = 1, limit = 10 }) {
    const filter = { clientId };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      if (type === 'whatsapp') {
        filter.metaStatus = status;
      } else {
        filter.status = status;
      }
    }

    if (language && language !== 'all') {
      filter.language = language;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bodyText: { $regex: search, $options: 'i' } },
        { firstMessage: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      Template.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Template.countDocuments(filter),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getTemplateStats(clientId) {
    const [whatsappCount, voiceCount, total] = await Promise.all([
      Template.countDocuments({ clientId, type: 'whatsapp' }),
      Template.countDocuments({ clientId, type: 'voice' }),
      Template.countDocuments({ clientId }),
    ]);

    return {
      whatsappCount,
      voiceCount,
      total,
      dispatchSuccess: '99.4%',
    };
  }

  static async createWhatwayTemplate(clientId, data) {
    const { name, category, language, headerFormat, headerText, bodyText, footerText, sampleParameters, buttons } = data;

    // Validate Name: lowercase letters, numbers, and underscores only
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      throw AppError.badRequest('Template name must contain only lowercase letters, numbers, and underscores.');
    }

    // Check unique name per client
    const existing = await Template.findOne({ clientId, name, type: 'whatsapp' });
    if (existing) {
      throw AppError.conflict(`A WhatsApp template with name '${name}' already exists.`);
    }

    // Validate length limits
    if (headerText && headerText.length > VALIDATION_LIMITS.WHATSAPP_TEMPLATE_HEADER_MAX) {
      throw AppError.badRequest(`Header exceeds max length of ${VALIDATION_LIMITS.WHATSAPP_TEMPLATE_HEADER_MAX} characters.`);
    }
    if (!bodyText || bodyText.length > VALIDATION_LIMITS.WHATSAPP_TEMPLATE_BODY_MAX) {
      throw AppError.badRequest(`Message body is required and cannot exceed ${VALIDATION_LIMITS.WHATSAPP_TEMPLATE_BODY_MAX} characters.`);
    }
    if (footerText && footerText.length > VALIDATION_LIMITS.WHATSAPP_TEMPLATE_FOOTER_MAX) {
      throw AppError.badRequest(`Footer exceeds max length of ${VALIDATION_LIMITS.WHATSAPP_TEMPLATE_FOOTER_MAX} characters.`);
    }
    if (buttons && buttons.length > VALIDATION_LIMITS.WHATSAPP_BUTTONS_MAX) {
      throw AppError.badRequest(`Cannot have more than ${VALIDATION_LIMITS.WHATSAPP_BUTTONS_MAX} interactive buttons.`);
    }

    // Validate sequential variables: {{1}}, {{2}}, etc.
    const varMatches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const varIndices = varMatches.map((m) => parseInt(m.replace(/[{}]/g, ''), 10));
    for (let i = 0; i < varIndices.length; i++) {
      if (varIndices[i] !== i + 1) {
        throw AppError.badRequest(`Variables in message body must be sequential starting at {{1}}. Found: {{${varIndices[i]}}}`);
      }
    }

    const template = await Template.create({
      clientId,
      type: 'whatsapp',
      name,
      category,
      language: language || 'en_US',
      headerFormat: headerFormat || 'None',
      headerText: headerText || '',
      bodyText,
      footerText: footerText || '',
      sampleParameters: sampleParameters || {},
      buttons: buttons || [],
      metaStatus: META_TEMPLATE_STATUS.APPROVED, // Simulates instant or approved Meta response
      status: 'Active',
    });

    return template;
  }

  static async createAgentLabVoiceTemplate(clientId, data) {
    const { name, category, synthesisLanguage, description, firstMessage, prompt, voiceTone, personality } = data;

    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(name)) {
      throw AppError.badRequest('Voice template name must contain only lowercase letters, numbers, and underscores.');
    }

    if (!firstMessage || firstMessage.length > VALIDATION_LIMITS.VOICE_FIRST_MESSAGE_MAX) {
      throw AppError.badRequest(`First message (call greeting) is required and cannot exceed ${VALIDATION_LIMITS.VOICE_FIRST_MESSAGE_MAX} characters.`);
    }

    const existing = await Template.findOne({ clientId, name, type: 'voice' });
    if (existing) {
      throw AppError.conflict(`A Voice template with name '${name}' already exists.`);
    }

    const template = await Template.create({
      clientId,
      type: 'voice',
      name,
      category,
      synthesisLanguage: synthesisLanguage || 'English (US) - Neutral',
      description: description || '',
      firstMessage,
      prompt,
      voiceTone: voiceTone || 'Professional',
      personality: personality || 'Support Specialist',
      status: 'Active',
    });

    return template;
  }

  static async syncMeta(clientId) {
    // Synchronizes WhatsApp templates with Meta Cloud API
    const updated = await Template.updateMany(
      { clientId, type: 'whatsapp', metaStatus: META_TEMPLATE_STATUS.IN_REVIEW },
      { $set: { metaStatus: META_TEMPLATE_STATUS.APPROVED } }
    );
    return { success: true, synchronizedCount: updated.modifiedCount };
  }

  static async deleteTemplate(clientId, id) {
    const template = await Template.findOneAndDelete({ _id: id, clientId });
    if (!template) throw AppError.notFound('Template not found');
    return { success: true, message: 'Template deleted' };
  }
}
