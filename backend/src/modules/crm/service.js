import { CrmLead, CRM_STAGES } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

export class CrmService {
  /**
   * List all leads grouped by Kanban stage
   */
  static async getPipeline(clientId) {
    const leads = await CrmLead.find({ clientId }).sort({ updatedAt: -1 });

    const pipeline = {};
    for (const stage of CRM_STAGES) {
      pipeline[stage] = [];
    }

    let totalValue = 0;
    for (const lead of leads) {
      if (pipeline[lead.stage]) {
        pipeline[lead.stage].push(lead);
      }
      totalValue += lead.dealValue || 0;
    }

    return {
      pipeline,
      stages: CRM_STAGES,
      totalLeads: leads.length,
      totalPipelineValue: totalValue,
    };
  }

  static async createLead(clientId, data) {
    if (!data.contactName || !data.phoneNumber) {
      throw new AppError('Contact name and phone number are required', 400);
    }
    return CrmLead.create({
      clientId,
      ...data,
    });
  }

  static async updateLead(clientId, leadId, data) {
    const lead = await CrmLead.findOneAndUpdate(
      { _id: leadId, clientId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!lead) {
      throw new AppError('CRM Lead not found', 404);
    }
    return lead;
  }

  static async updateStage(clientId, leadId, stage) {
    if (!CRM_STAGES.includes(stage)) {
      throw new AppError('Invalid pipeline stage', 400);
    }
    const lead = await CrmLead.findOneAndUpdate(
      { _id: leadId, clientId },
      { $set: { stage } },
      { new: true }
    );
    if (!lead) {
      throw new AppError('CRM Lead not found', 404);
    }
    return lead;
  }

  static async deleteLead(clientId, leadId) {
    const deleted = await CrmLead.findOneAndDelete({ _id: leadId, clientId });
    if (!deleted) {
      throw new AppError('CRM Lead not found', 404);
    }
    return { success: true };
  }
}
