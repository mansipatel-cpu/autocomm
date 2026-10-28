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
      if (items.length === 0 && (!type || type === 'voice') && !req.originalUrl.includes('/whatsapp/')) {
        items = DEFAULT_PROMPT_TEMPLATES;
      }

      const normalizedItems = items.map((t) => {
        let headerStr = '';
        let headerFormat = t.headerFormat || 'text';
        if (typeof t.header === 'string') {
          headerStr = t.header;
        } else if (t.header && typeof t.header === 'object') {
          headerStr = t.header.text || t.headerText || '';
          headerFormat = t.header.format || headerFormat;
        } else if (t.headerText) {
          headerStr = t.headerText;
        }

        let footerStr = '';
        if (typeof t.footer === 'string') {
          footerStr = t.footer;
        } else if (t.footer && typeof t.footer === 'object') {
          footerStr = t.footer.text || t.footerText || '';
        } else if (t.footerText) {
          footerStr = t.footerText;
        }

        let bodyStr = '';
        if (typeof t.body === 'string') {
          bodyStr = t.body;
        } else if (t.body && typeof t.body === 'object') {
          bodyStr = t.body.text || t.bodyText || '';
        } else if (t.bodyText) {
          bodyStr = t.bodyText;
        }

        let buttonsArr = [];
        if (Array.isArray(t.buttons)) {
          buttonsArr = t.buttons;
        } else if (typeof t.buttons === 'string') {
          try {
            buttonsArr = JSON.parse(t.buttons);
          } catch {}
        }

        return {
          ...t,
          header: headerStr,
          headerText: headerStr,
          headerType: headerFormat ? headerFormat.toLowerCase() : 'text',
          headerFormat: headerFormat,
          body: bodyStr,
          bodyText: bodyStr,
          footer: footerStr,
          footerText: footerStr,
          buttons: buttonsArr,
          status: (t.status === 'Active' || !t.status) && (t.type === 'whatsapp' || !t.type) ? 'APPROVED' : (t.status || 'APPROVED'),
          metaStatus: t.metaStatus || 'APPROVED',
          whatsappTemplateId: t.whatsappTemplateId || t.metaTemplateId || String(t.id),
        };
      });

      // Return { success: true, data: ... } for WhatsApp routes and channel-scoped queries
      if (req.originalUrl.includes('/whatsapp/') || req.query.channelId !== undefined) {
        return res.status(200).json({
          success: true,
          data: normalizedItems,
          pagination: {
            page: result.page || 1,
            limit: result.limit || 100,
            total: result.total || normalizedItems.length,
            totalPages: result.totalPages || 1,
          },
        });
      }

      return res.status(200).json(normalizedItems);
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

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      let template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.id === id);
      if (!template && /^\d+$/.test(id)) {
        template = await TemplateService.getTemplateById(req.clientId, id);
      }
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      return successResponse(res, template, 'Template retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async use(req, res, next) {
    try {
      const { id } = req.params;
      const { variableValues = {} } = req.body;

      let template = DEFAULT_PROMPT_TEMPLATES.find((t) => t.id === id);

      if (!template && /^\d+$/.test(id)) {
        const dbTemplate = await TemplateService.getTemplateById(req.clientId, id);
        if (dbTemplate) {
          template = {
            id: dbTemplate.id,
            name: dbTemplate.name,
            systemPrompt: dbTemplate.prompt || dbTemplate.content || '',
            firstMessage: dbTemplate.firstMessage || '',
            suggestedVoiceTone: dbTemplate.voiceTone || 'friendly',
            suggestedPersonality: dbTemplate.personality || 'helpful',
          };
        }
      }

      if (!template) {
        template = DEFAULT_PROMPT_TEMPLATES[0];
      }

      let systemPrompt = template.systemPrompt || '';
      let firstMessage = template.firstMessage || '';

      if (variableValues && typeof variableValues === 'object') {
        for (const [vKey, vVal] of Object.entries(variableValues)) {
          if (vVal) {
            const regex = new RegExp(`{{${vKey}}}`, 'g');
            systemPrompt = systemPrompt.replace(regex, vVal);
            firstMessage = firstMessage.replace(regex, vVal);
          }
        }
      }

      return res.status(200).json({
        success: true,
        id: template.id,
        systemPrompt,
        firstMessage,
        suggestedVoiceTone: template.suggestedVoiceTone,
        suggestedPersonality: template.suggestedPersonality,
      });
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
