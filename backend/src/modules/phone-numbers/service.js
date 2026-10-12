import { PhoneNumber } from './model.js';
import { Agent } from '../agents/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class PhoneNumberService {
  static async listNumbers(clientId, query = {}) {
    const filter = { clientId };
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    return PhoneNumber.find(filter).sort({ createdAt: -1 });
  }

  static async allocateNumber(clientId, data) {
    if (!data.phoneNumber) {
      throw new AppError('Phone number is required', 400);
    }

    const existing = await PhoneNumber.findOne({ clientId, phoneNumber: data.phoneNumber });
    if (existing) {
      throw new AppError('Phone number already allocated to this account', 400);
    }

    return PhoneNumber.create({
      clientId,
      ...data,
      status: 'ACTIVE',
    });
  }

  static async assignAgent(clientId, numberId, { agentId }) {
    const number = await PhoneNumber.findOne({ _id: numberId, clientId });
    if (!number) {
      throw new AppError('Phone number not found', 404);
    }

    if (!agentId || agentId === 'none') {
      number.assignedAgentId = null;
      number.assignedAgentName = 'Unassigned';
    } else {
      const agent = await Agent.findOne({ _id: agentId, clientId });
      if (!agent) {
        throw new AppError('Voice Agent not found', 404);
      }
      number.assignedAgentId = agent._id;
      number.assignedAgentName = agent.name;

      // Update agent's assignedPhoneNumber
      agent.assignedPhoneNumber = number.phoneNumber;
      await agent.save();
    }

    await number.save();
    return number;
  }

  static async releaseNumber(clientId, numberId) {
    const number = await PhoneNumber.findOne({ _id: numberId, clientId });
    if (!number) {
      throw new AppError('Phone number not found', 404);
    }
    number.status = 'RELEASED';
    number.assignedAgentId = null;
    number.assignedAgentName = 'Unassigned';
    await number.save();
    return number;
  }
}
