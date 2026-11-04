import { Router } from 'express';
import multer from 'multer';
import { CampaignController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

router.use(authenticate, requireTenant);

router.get('/', CampaignController.list);
router.get('/deleted', CampaignController.listDeleted);
router.get('/stats', CampaignController.stats);

// General campaign creation endpoint supporting both WhatsApp and Voice
router.post('/', (req, res, next) => {
  const channelType = req.body?.channelType || req.body?.channel_type || (req.body?.agentId ? 'voice' : 'whatsapp');
  if (channelType === 'voice' || channelType === 'calling') {
    return CampaignController.createAutoCalling(req, res, next);
  }
  return CampaignController.createWhatsApp(req, res, next);
});

router.post('/whatsapp', CampaignController.createWhatsApp);
router.post('/voice', CampaignController.createAutoCalling);
router.get('/:id', CampaignController.getDetails);
router.put('/:id', CampaignController.getDetails);

// Contacts list for a campaign
router.get('/:id/contacts', async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    const { CampaignRecipient } = await import('./model.js');
    const recipients = await CampaignRecipient.find({ campaignId }).lean();
    const formatted = (recipients || []).map((r) => ({
      id: r.id || r._id,
      name: r.name || 'Recipient',
      phoneNumber: r.phoneNumber || r.phone || '',
      phone: r.phoneNumber || r.phone || '',
      email: r.email || '',
      status: r.status || 'pending',
      dispatchedAt: r.dispatchedAt || null,
      errorDetails: r.errorDetails || '',
      customVariables: r.customVariables || {},
    }));
    return res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
});

// Calls list for a campaign
router.get('/:id/calls', async (req, res, next) => {
  try {
    const { CallRecord } = await import('../calls/model.js');
    const clientId = req.clientId || 1;
    const calls = await CallRecord.find({ clientId }).sort({ createdAt: -1 }).limit(100).lean();
    const formatted = (calls || []).map((c) => ({
      id: c.id || c._id,
      callId: c.callId || c.call_id,
      contactId: c.contactId || c.contact_id || c.id,
      contactPhoneNumber: c.contactPhoneNumber || c.contact_phone_number,
      contactName: c.contactName || c.contact_name,
      agentId: c.agentId || c.agent_id,
      agentName: c.agentName || c.agent_name,
      status: c.status ? c.status.toLowerCase() : 'completed',
      durationSeconds: c.durationSeconds || c.duration_seconds || 0,
      recordingUrl: c.recordingUrl || c.recording_url,
      startedAt: c.createdAt || c.created_at,
      ...c,
    }));
    return res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
});

// Contacts upload (CSV file via multipart/form-data)
router.post('/:id/contacts/upload', upload.single('file'), async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    let contactsList = [];

    if (req.file && req.file.buffer) {
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const item = {};
          header.forEach((h, idx) => {
            item[h] = cols[idx] || '';
          });
          const phone = item.phone || item.phone_number || item.phonenumber || item.mobile || cols[1] || cols[0];
          const name = item.name || item.contact_name || item.fullname || cols[0] || 'Recipient';
          if (phone) {
            contactsList.push({
              name,
              phone_number: phone,
              email: item.email || '',
              ...item,
            });
          }
        }
      }
    } else if (Array.isArray(req.body?.contacts)) {
      contactsList = req.body.contacts;
    }

    const { CampaignService } = await import('./service.js');
    const result = await CampaignService.addContactsCsv(req.clientId, campaignId, contactsList);
    return res.status(200).json({ success: true, count: contactsList.length, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contacts-csv', CampaignController.addContactsCsv);

// Start / Dispatch campaign
router.post(['/:id/dispatch', '/:id/start'], async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    try {
      const { query } = await import('../../config/postgres.js');
      await query(`UPDATE campaign_recipients SET status = 'pending' WHERE campaign_id = $1`, [campaignId]);
      await query(`UPDATE campaigns SET status = 'ongoing', started_at = COALESCE(started_at, NOW()) WHERE id = $1`, [campaignId]);
    } catch {}
    const { processCampaignDispatch } = await import('../../workers/campaign.worker.js');
    processCampaignDispatch(campaignId, req.clientId || 1).catch(() => {});
    return res.status(200).json({ success: true, message: 'Campaign live dispatch started' });
  } catch (err) {
    next(err);
  }
});

// Pause campaign
router.post('/:id/pause', async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    try {
      const { query } = await import('../../config/postgres.js');
      await query(`UPDATE campaigns SET status = 'paused' WHERE id = $1`, [campaignId]);
    } catch {}
    return res.status(200).json({ success: true, message: 'Campaign paused' });
  } catch (err) {
    next(err);
  }
});

// Export contacts/recipients as CSV
router.get('/:id/export', async (req, res, next) => {
  try {
    const campaignId = !isNaN(req.params.id) ? parseInt(req.params.id, 10) : req.params.id;
    const { CampaignRecipient } = await import('./model.js');
    const recipients = await CampaignRecipient.find({ campaignId }).lean();
    let csv = 'Name,Phone,Status,Error,DispatchedAt\n';
    (recipients || []).forEach((r) => {
      csv += `"${r.name || ''}","${r.phoneNumber || ''}","${r.status || ''}","${r.errorDetails || ''}","${r.dispatchedAt ? new Date(r.dispatchedAt).toISOString() : ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaignId}-export.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', CampaignController.softDelete);
router.post('/:id/restore', CampaignController.restore);

export default router;
