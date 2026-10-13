import { TemplateService } from './service.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

const DEFAULT_PROMPT_TEMPLATES = [
  {
    id: 'tpl_1',
    name: 'Customer Support Assistant',
    description: 'Empathetic agent for answering queries and resolving customer complaints.',
    category: 'agent_preset',
    systemPrompt: 'You are a friendly customer support representative for {{company_name}}. Assist {{customer_name}} with their questions in a clear and empathetic tone.',
    firstMessage: 'Hello! Thank you for calling {{company_name}}. How can I assist you today?',
    suggestedVoiceTone: 'friendly',
    suggestedPersonality: 'helpful',
    variables: ['company_name', 'customer_name'],
  },
  {
    id: 'tpl_2',
    name: 'Inbound Sales Qualifier',
    description: 'Qualifies inbound caller interest and gathers lead criteria.',
    category: 'sales',
    systemPrompt: 'You are an energetic sales specialist for {{company_name}}. Ask questions to understand the caller needs and determine the best package.',
    firstMessage: 'Hi there! Thanks for reaching out to {{company_name}}. Are you looking to upgrade your communications today?',
    suggestedVoiceTone: 'professional',
    suggestedPersonality: 'assertive',
    variables: ['company_name'],
  },
  {
    id: 'tpl_3',
    name: 'Appointment Scheduler',
    description: 'Books and reschedules calendar appointments seamlessly.',
    category: 'appointment',
    systemPrompt: 'You are a booking coordinator for {{company_name}}. Help the caller select a suitable time slot for their consultation.',
    firstMessage: 'Hello! I can help you book or reschedule an appointment with {{company_name}}. What day works best for you?',
    suggestedVoiceTone: 'professional',
    suggestedPersonality: 'concise',
    variables: ['company_name'],
  },
  {
    id: 'tpl_4',
    name: 'Feedback & Survey Collector',
    description: 'Collects feedback on recent service experience.',
    category: 'survey',
    systemPrompt: 'You are conducting a quick 2-minute satisfaction survey for {{company_name}}. Ask concise questions with ratings from 1 to 5.',
    firstMessage: 'Hi! Do you have two minutes to share feedback regarding your recent experience with {{company_name}}?',
    suggestedVoiceTone: 'friendly',
    suggestedPersonality: 'empathetic',
    variables: ['company_name'],
  },
];

export class TemplateController {
  static async list(req, res, next) {
    try {
      const { type, category, status, language, search, page, limit } = req.query;
      const result = await TemplateService.listTemplates({
        clientId: req.clientId,
        type,
        category,
        status,
        language,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10),
      });

      let items = result.templates || [];
      if (items.length === 0) {
        items = DEFAULT_PROMPT_TEMPLATES;
      }

      return res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  }

  static async stats(req, res, next) {
    try {
      const stats = await TemplateService.getTemplateStats(req.clientId);
      return successResponse(res, stats, 'Template stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createWhatway(req, res, next) {
    try {
      const template = await TemplateService.createWhatwayTemplate(req.clientId, req.body);
      return createdResponse(res, template, 'Whatway template submitted to Meta');
    } catch (error) {
      next(error);
    }
  }

  static async createVoice(req, res, next) {
    try {
      const template = await TemplateService.createAgentLabVoiceTemplate(req.clientId, req.body);
      return createdResponse(res, template, 'AgentLab voice template created');
    } catch (error) {
      next(error);
    }
  }

  static async syncMeta(req, res, next) {
    try {
      const result = await TemplateService.syncMeta(req.clientId);
      return successResponse(res, result, 'Templates synchronized with Meta API');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await TemplateService.deleteTemplate(req.clientId, req.params.id);
      return successResponse(res, result, 'Template removed');
    } catch (error) {
      next(error);
    }
  }
}
