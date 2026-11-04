import { Router } from 'express';
import { CrmService, AI_CATEGORIES } from './service.js';
import { query } from '../../config/database.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// ----------------- Stages & Preferences -----------------
router.get('/stages', (_req, res) =>
  res.json([
    { id: 'appointment_booked', name: 'Appointment Booked', color: '#10B981' },
    { id: 'form_submitted', name: 'Form Submitted', color: '#3B82F6' },
    { id: 'call_transfer', name: 'Call Transfer', color: '#8B5CF6' },
    { id: 'need_follow_up', name: 'Need Follow Up', color: '#F97316' },
    { id: 'hot', name: 'Hot Lead', color: '#EF4444' },
    { id: 'warm', name: 'Warm Lead', color: '#F59E0B' },
  ])
);

router.get('/preferences', (_req, res) =>
  res.json({
    hideLeadsWithoutPhone: false,
    hotScoreThreshold: 80,
    warmScoreThreshold: 50,
    hiddenCategories: [],
    colorOverrides: {},
    columnOrder: [
      'appointment_booked',
      'form_submitted',
      'call_transfer',
      'need_follow_up',
      'hot',
      'warm',
    ],
    columnSortPreferences: {},
  })
);

router.patch('/preferences', (_req, res) => res.json({ success: true }));
router.patch('/preferences/order', (_req, res) => res.json({ success: true }));
router.patch('/preferences/color/:id', (_req, res) => res.json({ success: true }));
router.patch('/preferences/sort/:id', (_req, res) => res.json({ success: true }));

router.get('/tags', async (req, res) => {
  res.json([
    'Verified Call',
    'High Intent',
    'Appointment',
    'Enterprise',
    'Web Form',
    'Inbound',
    'Call Transfer',
    'Outbound Campaign',
    'Retry Needed',
    'Warm',
    'Follow Up',
  ]);
});

router.get('/analytics', async (req, res) => {
  const clientId = req.clientId || req.user?.clientId || 3;
  const counts = await CrmService.getCategoryCounts(clientId);
  res.json({
    totalLeads: counts.total,
    conversionRate: counts.total > 0 ? Math.round(((counts.counts.hot + counts.counts.appointment_booked) / counts.total) * 100) : 0,
    stageBreakdown: counts.counts,
  });
});

// ----------------- AI Kanban & Categorized Leads -----------------
router.get('/leads/ai-kanban', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const kanban = await CrmService.getAIKanban(clientId);
    return res.json(kanban);
  } catch (err) {
    next(err);
  }
});

router.get('/leads/category-counts', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const counts = await CrmService.getCategoryCounts(clientId);
    return res.json(counts);
  } catch (err) {
    next(err);
  }
});

router.get('/leads/categorized', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const result = await CrmService.listCategorizedLeads(clientId, req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/leads/backfill-categories', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const counts = await CrmService.getCategoryCounts(clientId);
    return res.json({ success: true, updated: counts.total, total: counts.total });
  } catch (err) {
    next(err);
  }
});

// ----------------- Leads List & Actions -----------------
router.get('/leads', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const rows = await query(
      'SELECT * FROM crm_leads WHERE client_id = $1 ORDER BY updated_at DESC',
      [clientId]
    );
    const formatted = (rows.rows || []).map(CrmService.formatLead);
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/leads', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const { name, phoneNumber, phone, email, company, dealValue, notes, stage, aiCategory } = req.body;
    const targetCategory = aiCategory || stage || 'warm';

    const ins = await query(
      `INSERT INTO crm_leads (client_id, name, email, phone_number, company, stage, deal_value, notes, custom_fields, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        clientId,
        name || 'New Lead',
        email || '',
        phoneNumber || phone || '',
        company || '',
        targetCategory,
        parseFloat(dealValue || '0'),
        notes || '',
        JSON.stringify({
          aiCategory: targetCategory,
          leadScore: targetCategory === 'hot' ? 95 : 75,
          tags: ['Manual Lead'],
          lastCallAt: new Date(),
        }),
      ]
    );

    return res.status(201).json(CrmService.formatLead(ins.rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/leads/bulk/ai-category', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const { ids, aiCategory } = req.body;
    if (Array.isArray(ids) && ids.length > 0 && aiCategory) {
      for (const id of ids) {
        await CrmService.updateLeadCategory(clientId, id, aiCategory);
      }
    }
    return res.json({ success: true, count: ids?.length || 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/leads/bulk/tags', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const { ids, tags } = req.body;
    if (Array.isArray(ids) && ids.length > 0 && Array.isArray(tags)) {
      for (const id of ids) {
        const row = await query('SELECT custom_fields FROM crm_leads WHERE id = $1 AND client_id = $2', [id, clientId]);
        if (row.rows[0]) {
          const cf = typeof row.rows[0].custom_fields === 'string' ? JSON.parse(row.rows[0].custom_fields || '{}') : (row.rows[0].custom_fields || {});
          cf.tags = Array.from(new Set([...(cf.tags || []), ...tags]));
          await query('UPDATE crm_leads SET custom_fields = $1 WHERE id = $2', [JSON.stringify(cf), id]);
        }
      }
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/leads/bulk/delete', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      await query('DELETE FROM crm_leads WHERE id = ANY($1) AND client_id = $2', [ids, clientId]);
    }
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/leads/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const leadId = req.params.id;
    if (req.body.aiCategory || req.body.stage) {
      const updated = await CrmService.updateLeadCategory(
        clientId,
        leadId,
        req.body.aiCategory || req.body.stage
      );
      return res.json(updated);
    }
    return res.json({ success: true, id: leadId });
  } catch (err) {
    next(err);
  }
});

router.patch('/leads/:id/ai-category', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const updated = await CrmService.updateLeadCategory(
      clientId,
      req.params.id,
      req.body.aiCategory || 'warm'
    );
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/leads/:id', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    await query('DELETE FROM crm_leads WHERE id = $1 AND client_id = $2', [parseInt(req.params.id, 10), clientId]);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/export/csv', async (req, res, next) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 3;
    const rows = await query('SELECT * FROM crm_leads WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
    const leads = (rows.rows || []).map(CrmService.formatLead);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Company', 'Category', 'LeadScore', 'DealValue', 'Notes'];
    const lines = [headers.join(',')];
    for (const l of leads) {
      lines.push([
        l.id,
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.phone.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${l.company.replace(/"/g, '""')}"`,
        `"${l.aiCategory}"`,
        l.leadScore,
        l.dealValue,
        `"${l.notes.replace(/"/g, '""')}"`,
      ].join(','));
    }
    return res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

export default router;
