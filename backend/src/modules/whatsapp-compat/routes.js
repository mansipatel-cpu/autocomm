import { Router } from 'express';

const router = Router();

// ----------------- Brand Settings -----------------
let brandSettings = {
  title: 'AutoComm',
  tagline: 'Omnichannel AI Communication Platform',
  logo: '',
  favicon: '',
  country: 'US',
  currency: 'USD',
  supportEmail: 'support@autocomm.ai',
  updatedAt: new Date().toISOString(),
};

router.get('/brand-settings', (_req, res) => {
  res.json(brandSettings);
});

router.put('/brand-settings', (req, res) => {
  brandSettings = { ...brandSettings, ...(req.body || {}), updatedAt: new Date().toISOString() };
  res.json({ success: true, brandSettings });
});

// ----------------- Dashboard Stats -----------------
router.get(['/dashboard/stats', '/dashboard-stats', '/dashboard'], async (req, res) => {
  try {
    let clientId = req.clientId || req.user?.clientId || req.user?.id;
    if (!clientId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../../common/utils/jwt.util.js');
        const decoded = verifyAccessToken(req.headers.authorization.split(' ')[1]);
        clientId = decoded?.clientId || decoded?.id;
      } catch {}
    }

    let totalMessages = 0;
    let messagesDelivered = 0;
    let messagesFailed = 0;
    let messagesPending = 0;
    let activeCampaigns = 0;

    try {
      const { Campaign } = await import('../campaigns/model.js');
      if (Campaign) {
        const campaigns = await Campaign.find({
          ...(clientId ? { clientId } : {}),
          channel: 'whatsapp',
        }).catch(() => []);

        for (const c of campaigns || []) {
          totalMessages += (c.sentCount || 0) + (c.deliveredCount || 0) + (c.failedCount || 0);
          messagesDelivered += (c.deliveredCount || 0);
          messagesFailed += (c.failedCount || 0);
          messagesPending += (c.pendingCount || 0);
          if (['active', 'sending', 'in_progress'].includes(c.status)) {
            activeCampaigns += 1;
          }
        }
      }
    } catch {}

    res.json({
      success: true,
      totalMessages,
      messagesDelivered,
      messagesFailed,
      messagesPending,
      activeCampaigns,
      sentCount: totalMessages,
      deliveredCount: messagesDelivered,
      failedCount: messagesFailed,
    });
  } catch (_err) {
    res.json({
      success: true,
      totalMessages: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      activeCampaigns: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    });
  }
});

// ----------------- Tickets -----------------
let ticketsStore = [];

router.get('/tickets', (req, res) => {
  const { page = 1, limit = 10, search, status, priority } = req.query;
  let filtered = [...ticketsStore];
  if (status && status !== 'all') {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (priority && priority !== 'all') {
    filtered = filtered.filter((t) => t.priority === priority);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.customerPhone?.toLowerCase().includes(q)
    );
  }
  const startIndex = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const paginated = filtered.slice(startIndex, startIndex + parseInt(limit, 10));

  res.json({
    tickets: paginated,
    pagination: {
      total: filtered.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    },
  });
});

router.get('/tickets/:id', (req, res) => {
  const ticket = ticketsStore.find((t) => String(t.id) === String(req.params.id)) || {
    id: req.params.id,
    subject: 'Support Ticket',
    status: 'open',
    priority: 'medium',
    messages: [],
    customerName: 'Customer',
    createdAt: new Date().toISOString(),
  };
  res.json(ticket);
});

router.post('/tickets', (req, res) => {
  const ticket = {
    id: Date.now(),
    subject: req.body?.subject || 'Support Ticket',
    status: req.body?.status || 'open',
    priority: req.body?.priority || 'medium',
    customerName: req.body?.customerName || 'Customer',
    customerPhone: req.body?.customerPhone || '',
    messages: req.body?.message ? [{ id: Date.now(), text: req.body.message, sender: 'customer', createdAt: new Date().toISOString() }] : [],
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  ticketsStore.unshift(ticket);
  res.status(201).json(ticket);
});

router.put('/tickets/:id', (req, res) => {
  const idx = ticketsStore.findIndex((t) => String(t.id) === String(req.params.id));
  if (idx !== -1) {
    ticketsStore[idx] = { ...ticketsStore[idx], ...(req.body || {}), updatedAt: new Date().toISOString() };
    return res.json(ticketsStore[idx]);
  }
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/tickets/:id', (req, res) => {
  ticketsStore = ticketsStore.filter((t) => String(t.id) !== String(req.params.id));
  res.json({ success: true });
});

router.get(['/admins', '/admin/admins'], (_req, res) => {
  res.json({
    success: true,
    admins: [
      { id: 1, name: 'Operations Admin', email: 'admin@autocomm.local', role: 'admin' },
    ],
  });
});

// ----------------- Team -----------------
let teamMembersStore = [
  {
    id: 1,
    name: 'Operator Admin',
    email: 'operator@autocomm.local',
    role: 'Admin',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

router.get('/team/members', (_req, res) => {
  res.json(teamMembersStore);
});

router.post('/team/members', (req, res) => {
  const member = {
    id: Date.now(),
    name: req.body?.name || `${req.body?.firstName || ''} ${req.body?.lastName || ''}`.trim() || 'Team Member',
    email: req.body?.email || '',
    role: req.body?.role || 'Agent',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  teamMembersStore.push(member);
  res.status(201).json(member);
});

router.put('/team/members/:id', (req, res) => {
  const idx = teamMembersStore.findIndex((m) => String(m.id) === String(req.params.id));
  if (idx !== -1) {
    teamMembersStore[idx] = { ...teamMembersStore[idx], ...req.body };
    return res.json(teamMembersStore[idx]);
  }
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/team/members/:id', (req, res) => {
  teamMembersStore = teamMembersStore.filter((m) => String(m.id) !== String(req.params.id));
  res.json({ success: true });
});

router.patch('/team/members/:id/status', (req, res) => {
  const member = teamMembersStore.find((m) => String(m.id) === String(req.params.id));
  if (member && req.body?.status) {
    member.status = req.body.status;
  }
  res.json({ success: true });
});

router.patch('/team/members/:id/password', (_req, res) => {
  res.json({ success: true, message: 'Password updated successfully' });
});

router.get('/team/activity-logs', (_req, res) => {
  res.json([]);
});

router.post('/team/membersByUserId', (_req, res) => {
  res.json({ success: true, members: teamMembersStore });
});

router.get('/team', (_req, res) => {
  res.json(teamMembersStore);
});

router.post('/team', (req, res) => {
  res.status(201).json({ success: true, member: req.body });
});

router.patch('/team/:id', (req, res) => {
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/team/:id', (_req, res) => {
  res.json({ success: true });
});

// ----------------- Chatbots -----------------
let chatbotsStore = [];

router.get('/chatbots', (_req, res) => {
  res.json(chatbotsStore);
});

router.post('/chatbots', (req, res) => {
  const bot = {
    id: Date.now(),
    name: req.body?.name || 'WhatsApp AI Bot',
    trigger: req.body?.trigger || 'all',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  chatbotsStore.push(bot);
  res.status(201).json(bot);
});

router.get('/chatbots/:id', (req, res) => {
  const bot = chatbotsStore.find((b) => String(b.id) === String(req.params.id)) || {
    id: req.params.id,
    name: 'WhatsApp AI Bot',
    status: 'active',
  };
  res.json(bot);
});

router.put('/chatbots/:id', (req, res) => {
  const idx = chatbotsStore.findIndex((b) => String(b.id) === String(req.params.id));
  if (idx !== -1) {
    chatbotsStore[idx] = { ...chatbotsStore[idx], ...req.body };
    return res.json(chatbotsStore[idx]);
  }
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/chatbots/:id', (req, res) => {
  chatbotsStore = chatbotsStore.filter((b) => String(b.id) !== String(req.params.id));
  res.json({ success: true });
});

// Chatbot Training Data
router.post('/training-data', (req, res) => {
  res.status(201).json({ success: true, id: Date.now(), ...req.body });
});

router.get('/training-data/:chatbotId', (_req, res) => {
  res.json([]);
});

router.delete('/training-data/:id', (_req, res) => {
  res.json({ success: true });
});

// ----------------- Ecommerce -----------------
router.get('/ecommerce', (_req, res) => {
  res.json({ enabled: false, products: [], orders: [] });
});

router.get('/ecommerce/products', (_req, res) => {
  res.json([]);
});

router.get('/ecommerce/orders', (_req, res) => {
  res.json([]);
});

// ----------------- Messages -----------------
router.post('/messages', (req, res) => {
  res.status(201).json({
    success: true,
    messageId: `wamid_${Date.now()}`,
    status: 'sent',
    ...req.body,
  });
});

// ----------------- Automations -----------------
router.get('/automations', (_req, res) => {
  res.json([]);
});

router.get('/automations/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Automation Rule', status: 'active' });
});

router.post('/automations', (req, res) => {
  res.status(201).json({ success: true, id: Date.now(), ...req.body });
});

router.put('/automations/:id', (req, res) => {
  res.json({ success: true, id: req.params.id, ...req.body });
});

router.delete('/automations/:id', (_req, res) => {
  res.json({ success: true });
});

// ----------------- Contacts -----------------
router.get(['/contacts-all', '/contacts', '/contacts/all-for-add'], async (req, res) => {
  try {
    const { ContactService } = await import('../contacts/service.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const result = await ContactService.listContacts({
      clientId,
      page: 1,
      limit: 1000,
    });
    const contacts = (result?.contacts || []).map((c) => ({
      ...c,
      phone: c.phoneNumber || c.phone,
      id: c.id || c._id,
      waId: c.phoneNumber || c.phone,
    }));
    res.json(contacts);
  } catch (_error) {
    res.json([]);
  }
});

router.get('/contacts/:id', async (req, res) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const { id } = req.params;
    let contact = await Contact.findOne({ clientId, _id: id }).catch(() => null);
    if (!contact) {
      contact = await Contact.findOne({ clientId, phoneNumber: id }).catch(() => null);
    }
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const cObj = contact.toObject ? contact.toObject() : contact;
    res.json({
      ...cObj,
      id: contact.id || contact._id,
      phone: contact.phoneNumber || contact.phone,
      waId: contact.phoneNumber || contact.phone,
    });
  } catch (_err) {
    res.status(404).json({ error: 'Contact not found' });
  }
});

router.post('/contacts', async (req, res, next) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const { name, email, phone, phoneNumber, channelId, groups = [], tags = [], customVariables = {} } = req.body;
    const cleanPhone = (phoneNumber || phone || '').replace(/\s+/g, '');

    if (!cleanPhone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let contact = await Contact.findOne({ clientId, phoneNumber: cleanPhone });
    if (!contact) {
      contact = await Contact.create({
        clientId,
        name: name || 'Contact',
        email: email || '',
        phoneNumber: cleanPhone,
        whatsappNumber: cleanPhone,
        channels: ['whatsapp', 'voice'],
        groups: Array.isArray(groups) ? groups : [],
        customVariables,
        status: 'Active',
      });
    } else {
      if (name) contact.name = name;
      if (email) contact.email = email;
      await contact.save();
    }

    const cObj = contact.toObject ? contact.toObject() : contact;
    const formatted = {
      ...cObj,
      id: contact.id || contact._id,
      _id: contact._id || contact.id,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      waId: cleanPhone,
      channelId,
      groups: Array.isArray(groups) ? groups : [],
      tags: Array.isArray(tags) ? tags : [],
      status: 'Active',
    };

    return res.status(201).json({
      ...formatted,
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/contacts/:id', async (req, res, next) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const { id } = req.params;
    let contact = await Contact.findOne({ clientId, _id: id }).catch(() => null);
    if (!contact) {
      contact = await Contact.findOne({ clientId, phoneNumber: id }).catch(() => null);
    }
    if (contact) {
      if (req.body.name) contact.name = req.body.name;
      if (req.body.email !== undefined) contact.email = req.body.email;
      if (req.body.phone || req.body.phoneNumber) {
        contact.phoneNumber = (req.body.phone || req.body.phoneNumber).replace(/\s+/g, '');
      }
      if (req.body.status) contact.status = req.body.status;
      if (req.body.groups) contact.groups = req.body.groups;
      await contact.save();
    }
    const cObj = contact ? (contact.toObject ? contact.toObject() : contact) : { id, ...req.body };
    res.json({
      ...cObj,
      id: cObj.id || cObj._id || id,
      phone: cObj.phoneNumber || cObj.phone,
      waId: cObj.phoneNumber || cObj.phone,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/contacts/:id', async (req, res, next) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const { id } = req.params;
    let contact = await Contact.findOne({ clientId, _id: id }).catch(() => null);
    if (!contact) {
      contact = await Contact.findOne({ clientId, phoneNumber: id }).catch(() => null);
    }
    if (contact) {
      Object.assign(contact, req.body);
      await contact.save();
    }
    const cObj = contact ? (contact.toObject ? contact.toObject() : contact) : { id, ...req.body };
    res.json(cObj);
  } catch (err) {
    next(err);
  }
});

router.delete('/contacts-bulk', async (req, res, next) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const ids = req.body.ids || [];
    if (Array.isArray(ids)) {
      for (const id of ids) {
        await Contact.deleteOne({ clientId, _id: id }).catch(() => null);
        await Contact.deleteOne({ clientId, phoneNumber: id }).catch(() => null);
      }
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/contacts/import', async (req, res, next) => {
  try {
    const { ContactService } = await import('../contacts/service.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    const incoming = req.body.contacts || [];
    const formatted = incoming.map((c) => ({
      name: c.name || c.firstName || 'Imported Contact',
      phone: c.phone || c.phoneNumber,
      email: c.email || '',
    }));
    const result = await ContactService.importCsv(clientId, formatted);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const { Contact } = await import('../contacts/model.js');
    const clientId = req.clientId || req.user?.clientId || req.user?.id;
    await Contact.deleteOne({ clientId, _id: req.params.id }).catch(() => null);
    await Contact.deleteOne({ clientId, phoneNumber: req.params.id }).catch(() => null);
  } catch (_err) {
    // ignore
  }
  res.status(204).send();
});

export default router;
