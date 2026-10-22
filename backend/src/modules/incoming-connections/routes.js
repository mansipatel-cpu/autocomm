import { Router } from 'express';
import { Agent } from '../agents/model.js';
import { PhoneNumber } from '../phone-numbers/model.js';
import { IncomingConnection } from './model.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

// Auto-sync numbers from IncomingConnection into PhoneNumber model
const ensureNumbersSynced = async (clientId) => {
  try {
    if (!clientId) return;
    const incoming = await IncomingConnection.find({ clientId }).lean();
    for (const conn of incoming) {
      if (conn.phoneNumber && String(conn.phoneNumber).trim()) {
        const rawPhone = String(conn.phoneNumber).trim();
        const existing = await PhoneNumber.findOne({ clientId, phoneNumber: rawPhone });
        if (!existing) {
          await PhoneNumber.create({
            clientId,
            phoneNumber: rawPhone,
            friendlyName: conn.name || 'Incoming Trunk Line',
            status: conn.status === 'INACTIVE' ? 'AVAILABLE' : 'ACTIVE',
            assignedAgentId: conn.agentId || null,
            assignedAgentName: conn.agentName || 'Unassigned',
          });
        }
      }
    }
  } catch (err) {
    // non-blocking sync
  }
};

// 1. Twilio + Elevenlabs / Default incoming connections
export const incomingConnectionRoutes = Router();
incomingConnectionRoutes.use(authenticate, requireTenant);

incomingConnectionRoutes.get('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await ensureNumbersSynced(clientId);

    const [agents, phoneNumbers, dbConnections] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
      IncomingConnection.find({ clientId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Filter connections for Twilio / Elevenlabs (exclude Plivo)
    const twilioConns = dbConnections.filter(c => (c.provider || '').toLowerCase() !== 'plivo');

    const connections = twilioConns.map((conn) => {
      const matchedPhone = phoneNumbers.find(p => 
        p.phoneNumber === conn.phoneNumber || 
        String(p.id || p._id) === String(conn.phoneNumberId)
      );
      const matchedAgent = agents.find(a => 
        String(a.id || a._id) === String(conn.agentId)
      ) || (agents.length > 0 ? agents[0] : null);

      return {
        id: conn.id || conn._id,
        _id: conn.id || conn._id,
        clientId,
        agentId: conn.agentId || matchedAgent?.id || null,
        phoneNumberId: matchedPhone?.id || conn.id,
        phoneNumber: {
          id: matchedPhone?.id || conn.id,
          phoneNumber: conn.phoneNumber || matchedPhone?.phoneNumber || '+1000000000',
          friendlyName: conn.name || matchedPhone?.friendlyName || 'Twilio Line',
          country: matchedPhone?.country || 'US',
        },
        agent: {
          id: matchedAgent?.id || conn.agentId || 0,
          name: conn.agentName || matchedAgent?.name || 'Incoming AI Voice Agent',
          language: matchedAgent?.language || 'en',
          telephonyProvider: matchedAgent?.telephonyProvider || 'twilio',
        },
        status: conn.status || 'ACTIVE',
        createdAt: conn.createdAt || new Date().toISOString(),
      };
    });

    return res.status(200).json({
      connections,
      incomingAgents: agents,
      availablePhoneNumbers: phoneNumbers,
    });
  } catch (err) {
    next(err);
  }
});

incomingConnectionRoutes.post('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const { agentId, phoneNumberId } = req.body;

    const [agent, phoneNumber] = await Promise.all([
      Agent.findOne({ _id: agentId, clientId }).catch(() => Agent.findById(agentId)),
      PhoneNumber.findOne({ _id: phoneNumberId, clientId }).catch(() => PhoneNumber.findById(phoneNumberId)),
    ]);

    const agentName = agent?.name || 'Incoming AI Agent';
    const phoneNum = phoneNumber?.phoneNumber || '';

    const newDoc = await IncomingConnection.create({
      name: `${phoneNum || 'Phone'} -> ${agentName}`,
      provider: 'Twilio',
      clientId,
      phoneNumber: phoneNum,
      agentId: agent?.id || agent?._id || null,
      agentName,
      status: 'ACTIVE',
      lastActivityAt: new Date(),
    });

    if (phoneNumber) {
      phoneNumber.assignedAgentId = agent?.id || agent?._id;
      phoneNumber.assignedAgentName = agentName;
      await phoneNumber.save().catch(() => {});
    }

    const responsePayload = {
      id: newDoc.id || newDoc._id,
      _id: newDoc.id || newDoc._id,
      clientId,
      agentId,
      phoneNumberId,
      phoneNumber: {
        id: phoneNumber?.id || phoneNumberId,
        phoneNumber: phoneNum || '+1234567890',
        friendlyName: phoneNumber?.friendlyName || newDoc.name,
        country: phoneNumber?.country || 'US',
      },
      agent: {
        id: agent?.id || agentId,
        name: agentName,
        language: agent?.language || 'en',
        telephonyProvider: agent?.telephonyProvider || 'twilio',
      },
      createdAt: newDoc.createdAt || new Date().toISOString(),
    };

    return createdResponse(res, responsePayload, 'Incoming connection established');
  } catch (err) {
    next(err);
  }
});

incomingConnectionRoutes.delete('/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await IncomingConnection.findOneAndDelete({ _id: req.params.id, clientId }).catch(() => {
      return IncomingConnection.findByIdAndDelete(req.params.id);
    });

    return successResponse(res, { id: req.params.id }, 'Incoming connection deleted');
  } catch (err) {
    next(err);
  }
});

// 2. Plivo + OpenAI
export const plivoIncomingRoutes = Router();
plivoIncomingRoutes.use(authenticate, requireTenant);

plivoIncomingRoutes.get('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await ensureNumbersSynced(clientId);

    const [agents, phoneNumbers, dbConnections] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
      IncomingConnection.find({ clientId }).sort({ createdAt: -1 }).lean(),
    ]);

    const plivoConns = dbConnections.filter(c => (c.provider || '').toLowerCase() === 'plivo');

    const connections = plivoConns.map((conn) => {
      const matchedPhone = phoneNumbers.find(p => 
        p.phoneNumber === conn.phoneNumber || 
        String(p.id || p._id) === String(conn.phoneNumberId)
      );
      const matchedAgent = agents.find(a => 
        String(a.id || a._id) === String(conn.agentId)
      ) || (agents.length > 0 ? agents[0] : null);

      return {
        id: conn.id || conn._id,
        _id: conn.id || conn._id,
        phoneNumberId: matchedPhone?.id || conn.id || conn._id,
        phoneNumber: conn.phoneNumber || matchedPhone?.phoneNumber || '',
        friendlyName: conn.name || matchedPhone?.friendlyName || 'Plivo Line',
        country: matchedPhone?.country || 'US',
        agent: {
          id: matchedAgent?.id || conn.agentId || 0,
          name: conn.agentName || matchedAgent?.name || 'Plivo Voice Agent',
          language: matchedAgent?.language || 'en',
        },
        status: conn.status || 'ACTIVE',
        createdAt: conn.createdAt || new Date().toISOString(),
      };
    });

    return res.status(200).json({
      connections,
      availableNumbers: phoneNumbers,
      agents,
      stats: {
        totalConnections: connections.length,
        availableNumbers: phoneNumbers.length,
        totalAgents: agents.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

plivoIncomingRoutes.post('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const { agentId, phoneNumberId } = req.body;

    const [agent, phoneNumber] = await Promise.all([
      Agent.findOne({ _id: agentId, clientId }).catch(() => Agent.findById(agentId)),
      PhoneNumber.findOne({ _id: phoneNumberId, clientId }).catch(() => PhoneNumber.findById(phoneNumberId)),
    ]);

    const agentName = agent?.name || 'Plivo Voice Agent';
    const phoneNum = phoneNumber?.phoneNumber || '';

    const newDoc = await IncomingConnection.create({
      name: `${phoneNum || 'Phone'} -> ${agentName}`,
      provider: 'Plivo',
      clientId,
      phoneNumber: phoneNum,
      agentId: agent?.id || agent?._id || null,
      agentName,
      status: 'ACTIVE',
      lastActivityAt: new Date(),
    });

    return createdResponse(res, {
      id: newDoc.id || newDoc._id,
      phoneNumberId: phoneNumber?.id || phoneNumberId,
      phoneNumber: phoneNum,
      friendlyName: newDoc.name,
      country: phoneNumber?.country || 'US',
      agent: {
        id: agent?.id || agentId,
        name: agentName,
        language: agent?.language || 'en',
      },
    }, 'Plivo connection created');
  } catch (err) {
    next(err);
  }
});

plivoIncomingRoutes.delete('/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await IncomingConnection.findOneAndDelete({ _id: req.params.id, clientId }).catch(() => {
      return IncomingConnection.findByIdAndDelete(req.params.id);
    });
    return successResponse(res, { id: req.params.id }, 'Plivo connection removed');
  } catch (err) {
    next(err);
  }
});

// 3. Twilio + OpenAI
export const twilioOpenaiIncomingRoutes = Router();
twilioOpenaiIncomingRoutes.use(authenticate, requireTenant);

twilioOpenaiIncomingRoutes.get('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await ensureNumbersSynced(clientId);

    const [agents, phoneNumbers, dbConnections] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
      IncomingConnection.find({ clientId }).sort({ createdAt: -1 }).lean(),
    ]);

    // Twilio + OpenAI connections
    const twilioOpenaiConns = dbConnections.filter(c => (c.provider || '').toLowerCase() === 'twilio');

    const connections = twilioOpenaiConns.map((conn) => {
      const matchedPhone = phoneNumbers.find(p => 
        p.phoneNumber === conn.phoneNumber || 
        String(p.id || p._id) === String(conn.phoneNumberId)
      );
      const matchedAgent = agents.find(a => 
        String(a.id || a._id) === String(conn.agentId)
      ) || (agents.length > 0 ? agents[0] : null);

      return {
        id: conn.id || conn._id,
        _id: conn.id || conn._id,
        phoneNumber: {
          id: matchedPhone?.id || conn.id,
          phoneNumber: conn.phoneNumber || matchedPhone?.phoneNumber || '',
          friendlyName: conn.name || matchedPhone?.friendlyName || 'Twilio Line',
          country: matchedPhone?.country || 'US',
        },
        agent: {
          id: matchedAgent?.id || conn.agentId || 0,
          name: conn.agentName || matchedAgent?.name || 'OpenAI Voice Agent',
          language: matchedAgent?.language || 'en',
        },
        status: conn.status || 'ACTIVE',
        createdAt: conn.createdAt || new Date().toISOString(),
      };
    });

    return res.status(200).json({
      connections,
      availablePhoneNumbers: phoneNumbers,
      availableNumbers: phoneNumbers,
      agents,
      availableAgents: agents,
      stats: {
        totalConnections: connections.length,
        availableNumbers: phoneNumbers.length,
        totalAgents: agents.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

twilioOpenaiIncomingRoutes.post('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const { agentId, phoneNumberId } = req.body;

    const [agent, phoneNumber] = await Promise.all([
      Agent.findOne({ _id: agentId, clientId }).catch(() => Agent.findById(agentId)),
      PhoneNumber.findOne({ _id: phoneNumberId, clientId }).catch(() => PhoneNumber.findById(phoneNumberId)),
    ]);

    const agentName = agent?.name || 'OpenAI Voice Agent';
    const phoneNum = phoneNumber?.phoneNumber || '';

    const newDoc = await IncomingConnection.create({
      name: `${phoneNum || 'Phone'} -> ${agentName}`,
      provider: 'Twilio',
      clientId,
      phoneNumber: phoneNum,
      agentId: agent?.id || agent?._id || null,
      agentName,
      status: 'ACTIVE',
      lastActivityAt: new Date(),
    });

    return createdResponse(res, {
      id: newDoc.id || newDoc._id,
      phoneNumber: {
        id: phoneNumber?.id || phoneNumberId,
        phoneNumber: phoneNum,
        friendlyName: newDoc.name,
        country: phoneNumber?.country || 'US',
      },
      agent: {
        id: agent?.id || agentId,
        name: agentName,
        language: agent?.language || 'en',
      },
    }, 'Twilio+OpenAI connection created');
  } catch (err) {
    next(err);
  }
});

twilioOpenaiIncomingRoutes.delete('/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    await IncomingConnection.findOneAndDelete({ _id: req.params.id, clientId }).catch(() => {
      return IncomingConnection.findByIdAndDelete(req.params.id);
    });
    return successResponse(res, { id: req.params.id }, 'Twilio+OpenAI connection removed');
  } catch (err) {
    next(err);
  }
});

export default incomingConnectionRoutes;
