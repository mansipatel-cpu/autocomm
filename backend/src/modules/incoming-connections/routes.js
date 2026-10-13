import { Router } from 'express';
import { Agent } from '../agents/model.js';
import { PhoneNumber } from '../phone-numbers/model.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

// Memory cache for active incoming connections across sessions
const connectionsStore = new Map();

const getClientConnections = (clientId) => {
  if (!connectionsStore.has(clientId)) {
    connectionsStore.set(clientId, []);
  }
  return connectionsStore.get(clientId);
};

// 1. Twilio + Elevenlabs / Default incoming connections
export const incomingConnectionRoutes = Router();
incomingConnectionRoutes.use(authenticate, requireTenant);

incomingConnectionRoutes.get('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const [agents, phoneNumbers] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
    ]);

    const activeConnections = getClientConnections(clientId);

    return res.status(200).json({
      connections: activeConnections,
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
      Agent.findById(agentId),
      PhoneNumber.findById(phoneNumberId),
    ]);

    const newConn = {
      id: 'conn_' + Date.now(),
      clientId,
      agentId,
      phoneNumberId,
      agent: agent || { id: agentId, name: 'AI Agent', language: 'en' },
      phoneNumber: phoneNumber || { id: phoneNumberId, phoneNumber: '+1234567890', friendlyName: 'Phone Number' },
      createdAt: new Date().toISOString(),
    };

    const list = getClientConnections(clientId);
    list.push(newConn);

    return createdResponse(res, newConn, 'Incoming connection established');
  } catch (err) {
    next(err);
  }
});

incomingConnectionRoutes.delete('/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const list = getClientConnections(clientId);
    const idx = list.findIndex(c => c.id === req.params.id);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
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
    const [agents, phoneNumbers] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
    ]);

    return res.status(200).json({
      connections: [],
      availableNumbers: phoneNumbers,
      agents,
      stats: {
        totalConnections: 0,
        availableNumbers: phoneNumbers.length,
        totalAgents: agents.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

plivoIncomingRoutes.post('/', async (req, res) => {
  return createdResponse(res, { id: 'plivo_' + Date.now(), ...req.body }, 'Plivo connection created');
});

plivoIncomingRoutes.delete('/:id', async (req, res) => {
  return successResponse(res, { id: req.params.id }, 'Plivo connection removed');
});

// 3. Twilio + OpenAI
export const twilioOpenaiIncomingRoutes = Router();
twilioOpenaiIncomingRoutes.use(authenticate, requireTenant);

twilioOpenaiIncomingRoutes.get('/', async (req, res, next) => {
  try {
    const clientId = req.clientId;
    const [agents, phoneNumbers] = await Promise.all([
      Agent.find({ clientId }).lean(),
      PhoneNumber.find({ clientId }).lean(),
    ]);

    return res.status(200).json({
      connections: [],
      availableNumbers: phoneNumbers,
      agents,
      stats: {
        totalConnections: 0,
        availableNumbers: phoneNumbers.length,
        totalAgents: agents.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

twilioOpenaiIncomingRoutes.post('/', async (req, res) => {
  return createdResponse(res, { id: 'tw_openai_' + Date.now(), ...req.body }, 'Twilio+OpenAI connection created');
});

twilioOpenaiIncomingRoutes.delete('/:id', async (req, res) => {
  return successResponse(res, { id: req.params.id }, 'Twilio+OpenAI connection removed');
});

export default incomingConnectionRoutes;
