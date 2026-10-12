import { Agent } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

export class AgentService {
  static async listAgents(clientId, query = {}) {
    const filter = { clientId };
    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    return Agent.find(filter).sort({ createdAt: -1 });
  }

  static async getAgent(clientId, agentId) {
    const agent = await Agent.findOne({ _id: agentId, clientId });
    if (!agent) {
      throw new AppError('Voice Agent not found', 404);
    }
    return agent;
  }

  static async createAgent(clientId, data) {
    if (!data.name || !data.name.trim()) {
      throw new AppError('Agent name is required', 400);
    }
    return Agent.create({
      clientId,
      ...data,
      name: data.name.trim(),
    });
  }

  static async updateAgent(clientId, agentId, data) {
    const agent = await Agent.findOneAndUpdate(
      { _id: agentId, clientId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!agent) {
      throw new AppError('Voice Agent not found', 404);
    }
    return agent;
  }

  static async toggleStatus(clientId, agentId) {
    const agent = await this.getAgent(clientId, agentId);
    agent.status = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await agent.save();
    return agent;
  }

  static async deleteAgent(clientId, agentId) {
    const deleted = await Agent.findOneAndDelete({ _id: agentId, clientId });
    if (!deleted) {
      throw new AppError('Voice Agent not found', 404);
    }
    return { success: true };
  }
}
