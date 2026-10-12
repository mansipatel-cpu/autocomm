import { CallRecord } from './model.js';
import { Agent } from '../agents/model.js';
import { AppError } from '../../common/errors/app-error.js';

export class CallService {
  static async listCalls(clientId, query = {}) {
    const filter = { clientId };

    if (query.direction && query.direction !== 'all') {
      filter.direction = query.direction;
    }
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.search) {
      const q = query.search;
      filter.$or = [
        { contactName: { $regex: q, $options: 'i' } },
        { contactPhoneNumber: { $regex: q, $options: 'i' } },
        { callId: { $regex: q, $options: 'i' } },
      ];
    }

    return CallRecord.find(filter).sort({ callDate: -1 }).limit(100);
  }

  static async getCall(clientId, callRecordId) {
    const call = await CallRecord.findOne({ _id: callRecordId, clientId });
    if (!call) {
      throw new AppError('Call record not found', 404);
    }
    return call;
  }

  /**
   * Initiate a simulated test call for voice agent testing
   */
  static async createTestCall(clientId, { agentId, contactPhoneNumber, contactName }) {
    let agentName = 'Rachel (AgentLab)';
    if (agentId) {
      const agent = await Agent.findOne({ _id: agentId, clientId });
      if (agent) {
        agentName = agent.name;
      }
    }

    const testCallId = `call_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const duration = Math.floor(Math.random() * 90) + 45; // 45s - 135s

    const transcript = [
      {
        speaker: 'agent',
        text: 'Hello! Thank you for speaking with AutoComm support. How may I assist you today?',
        timestampSeconds: 2,
      },
      {
        speaker: 'user',
        text: 'Hi, I received an inquiry notification and wanted to confirm my appointment for tomorrow at 3 PM.',
        timestampSeconds: 8,
      },
      {
        speaker: 'agent',
        text: 'I see your appointment on file for tomorrow at 3:00 PM. Everything is confirmed and your calendar invite has been sent!',
        timestampSeconds: 16,
      },
      {
        speaker: 'user',
        text: 'Great, thank you so much for the quick confirmation!',
        timestampSeconds: 22,
      },
      {
        speaker: 'agent',
        text: 'You are very welcome! Have a wonderful rest of your day. Goodbye!',
        timestampSeconds: 26,
      },
    ];

    return CallRecord.create({
      clientId,
      callId: testCallId,
      agentId: agentId || null,
      agentName,
      contactPhoneNumber: contactPhoneNumber || '+1 (555) 392-8172',
      contactName: contactName || 'Alex Mercer',
      direction: 'outbound',
      status: 'COMPLETED',
      durationSeconds: duration,
      recordingUrl: 'https://assets.autocomm.io/recordings/sample_call.mp3',
      transcript,
      aiSummary: 'Customer verified appointment confirmation for tomorrow at 3 PM. Agent validated records and confirmed status immediately.',
      sentiment: 'Positive',
      costCredits: parseFloat(((duration / 60) * 0.5).toFixed(2)),
      callDate: new Date(),
    });
  }
}
