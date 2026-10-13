import { ConversationFlow } from './model.js';
import { Client } from '../clients/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class FlowBuilderService {
  static async listFlows(query = {}) {
    const filter = {};
    if (query.clientId) {
      filter.$or = [{ assignedClientId: query.clientId }, { assignedClientId: null }];
    }
    return ConversationFlow.find(filter).sort({ updatedAt: -1 });
  }

  static async getFlow(flowId) {
    const flow = await ConversationFlow.findById(flowId);
    if (!flow) {
      throw new AppError('Flow not found', 404);
    }
    return flow;
  }

  static async createFlow(data) {
    if (!data.name || !data.name.trim()) {
      throw new AppError('Flow name is required', 400);
    }
    return ConversationFlow.create({
      ...data,
      name: data.name.trim(),
    });
  }

  static async updateFlow(flowId, data) {
    const flow = await ConversationFlow.findByIdAndUpdate(
      flowId,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!flow) {
      throw new AppError('Flow not found', 404);
    }
    return flow;
  }

  static async assignToClient(flowId, { clientId, voiceAgentId, voiceAgentName, assignedPhoneNumber, status, effectiveDate }) {
    const flow = await this.getFlow(flowId);

    const updatePayload = {};

    if (!clientId || clientId === 'global') {
      updatePayload.assignedClientId = null;
      updatePayload.clientId = null;
      updatePayload.assignedClientName = 'Global System Template';
    } else {
      const client = await Client.findById(clientId);
      if (!client) {
        throw new AppError('Target client not found', 404);
      }
      updatePayload.assignedClientId = client._id;
      updatePayload.clientId = client._id;
      updatePayload.assignedClientName = client.companyName;
    }

    if (voiceAgentId !== undefined) updatePayload.voiceAgentId = voiceAgentId || null;
    if (voiceAgentName !== undefined) updatePayload.voiceAgentName = voiceAgentName || '';
    if (assignedPhoneNumber !== undefined) updatePayload.assignedPhoneNumber = assignedPhoneNumber || '';
    if (status !== undefined) updatePayload.status = status;
    if (effectiveDate !== undefined) updatePayload.effectiveDate = new Date(effectiveDate);

    const updated = await ConversationFlow.findByIdAndUpdate(
      flowId,
      { $set: updatePayload },
      { new: true }
    );
    return updated || flow;
  }

  static async deleteFlow(flowId) {
    const deleted = await ConversationFlow.findByIdAndDelete(flowId);
    if (!deleted) {
      throw new AppError('Flow not found', 404);
    }
    return { success: true };
  }
}
