import { AiSettings } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

export class AiSettingsService {
  /**
   * Get tenant AI settings, auto-creating default if none exists
   */
  static async getSettings(clientId) {
    let settings = await AiSettings.findOne({ clientId });
    if (!settings) {
      settings = await AiSettings.create({
        clientId,
      });
    }
    return settings;
  }

  /**
   * Update tenant AI settings
   */
  static async updateSettings(clientId, data) {
    let settings = await AiSettings.findOne({ clientId });
    if (!settings) {
      settings = new AiSettings({ clientId, ...data });
    } else {
      Object.assign(settings, data);
    }
    await settings.save();
    return settings;
  }

  /**
   * Test chat simulator with current AI settings and knowledge
   */
  static async testChat(clientId, userMessage) {
    if (!userMessage || !userMessage.trim()) {
      throw new AppError('Message is required for AI test', 400);
    }

    const settings = await this.getSettings(clientId);
    const textLower = userMessage.toLowerCase();

    // Check escalation keywords
    const matchedEscalation = (settings.escalationKeywords || []).find((kw) =>
      textLower.includes(kw.toLowerCase())
    );

    if (matchedEscalation && settings.autoEscalate) {
      return {
        reply: `I understand you would like to speak with a human team member regarding "${matchedEscalation}". I have flagged this conversation and connected you to an agent.`,
        escalated: true,
        matchedRule: `Escalation keyword: ${matchedEscalation}`,
      };
    }

    // Check Q&A Pairs
    const matchedQA = (settings.qaPairs || []).find((qa) =>
      textLower.includes(qa.question.toLowerCase().trim()) ||
      qa.question.toLowerCase().trim().includes(textLower)
    );

    if (matchedQA) {
      return {
        reply: matchedQA.answer,
        escalated: false,
        matchedRule: `Q&A Match: ${matchedQA.question}`,
      };
    }

    // Standard simulated response reflecting tone and prompt
    const tonePrefixes = {
      Professional: 'Thank you for your inquiry. Regarding your request:',
      Friendly: 'Hey there! Happy to help you with that! 😊',
      Direct: 'Here is what you need to know:',
      Empathetic: 'We completely understand how important this is to you. Let me help you with this right away:',
    };

    const prefix = tonePrefixes[settings.tone] || tonePrefixes.Friendly;

    return {
      reply: `${prefix} Based on our AutoComm knowledge base and settings (${settings.provider} - ${settings.model}), we are processing: "${userMessage}". Let us know if you need any further assistance!`,
      escalated: false,
      matchedRule: 'General AI Assistant Response',
    };
  }
}
