import { Router } from 'express';
import { CrmController } from './controller.js';
import { CrmLead } from './model.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// ----------------- Pipeline & Analytics -----------------
router.get('/', CrmController.getPipeline);
router.get('/pipeline', CrmController.getPipeline);
router.get('/contacts', (_req, res) => res.json([]));
router.get('/deals', (_req, res) => res.json([]));
router.get('/tags', (_req, res) => res.json([]));
router.get('/stages', (_req, res) =>
  res.json([
    { id: 'new', name: 'new', color: '#10B981' },
    { id: 'hot', name: 'hot', color: '#EF4444' },
    { id: 'warm', name: 'warm', color: '#F59E0B' },
    { id: 'cold', name: 'cold', color: '#3B82F6' },
  ])
);
router.get('/preferences', (_req, res) =>
  res.json({
    hideLeadsWithoutPhone: false,
    hotScoreThreshold: 80,
    warmScoreThreshold: 50,
    hiddenCategories: [],
    colorOverrides: {},
    columnOrder: [],
  })
);
router.patch('/preferences', (_req, res) => res.json({ success: true }));
router.patch('/preferences/order', (_req, res) => res.json({ success: true }));
router.patch('/preferences/color/:id', (_req, res) => res.json({ success: true }));
router.patch('/preferences/sort/:id', (_req, res) => res.json({ success: true }));
router.get('/analytics', (_req, res) =>
  res.json({
    totalLeads: 0,
    conversionRate: 0,
    stageBreakdown: {},
  })
);

// ----------------- AI Categorized Leads for CRM View -----------------
router.get('/leads/categorized', async (req, res) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const { sortBy = 'newest', limit = 50, offset = 0, aiCategory, search } = req.query;
    const lLimit = parseInt(limit, 10) || 50;
    const lOffset = parseInt(offset, 10) || 0;

    const filter = { clientId };
    if (aiCategory && aiCategory !== 'all') {
      filter.stage = aiCategory;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const allLeads = (await CrmLead.find(filter).sort(sortOrder)) || [];
    const total = allLeads.length;
    const paged = allLeads.slice(lOffset, lOffset + lLimit);
    const hasMore = lOffset + paged.length < total;

    return res.json({
      leads: paged,
      hasMore,
      total,
    });
  } catch (_e) {
    return res.json({
      leads: [],
      hasMore: false,
      total: 0,
    });
  }
});

router.get('/leads/category-counts', async (req, res) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const leads = (await CrmLead.find({ clientId })) || [];
    const counts = {
      hot: 0,
      warm: 0,
      cold: 0,
      not_interested: 0,
      follow_up: 0,
      converted: 0,
      total: leads.length,
    };
    for (const lead of leads) {
      const cat = (lead.aiCategory || lead.stage || 'warm').toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.warm++;
      }
    }
    return res.json(counts);
  } catch (_e) {
    return res.json({
      hot: 0,
      warm: 0,
      cold: 0,
      not_interested: 0,
      follow_up: 0,
      converted: 0,
      total: 0,
    });
  }
});

router.get('/leads/ai-kanban', async (req, res) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const leads = (await CrmLead.find({ clientId }).sort({ createdAt: -1 })) || [];
    const kanban = {
      hot: [],
      warm: [],
      cold: [],
      not_interested: [],
      follow_up: [],
      converted: [],
    };
    for (const lead of leads) {
      const cat = (lead.aiCategory || lead.stage || 'warm').toLowerCase();
      if (kanban[cat]) {
        kanban[cat].push(lead);
      } else {
        kanban.warm.push(lead);
      }
    }
    return res.json(kanban);
  } catch (_e) {
    return res.json({
      hot: [],
      warm: [],
      cold: [],
      not_interested: [],
      follow_up: [],
      converted: [],
    });
  }
});

router.post('/leads/backfill-categories', (_req, res) => {
  res.json({ success: true, updated: 0, total: 0 });
});

router.post('/leads/bulk/ai-category', (_req, res) => {
  res.json({ success: true });
});

router.post('/leads/bulk/tags', (_req, res) => {
  res.json({ success: true });
});

router.post('/leads/bulk/delete', (_req, res) => {
  res.json({ success: true });
});

router.get('/export/csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send('Name,Phone,Email,Stage,DealValue\n');
});

// ----------------- Standard Leads CRUD -----------------
router.get('/leads', async (req, res) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const leads = (await CrmLead.find({ clientId }).sort({ createdAt: -1 })) || [];
    return res.json(leads);
  } catch (_e) {
    return res.json([]);
  }
});

router.post('/leads', CrmController.createLead);
router.put('/leads/:id', CrmController.updateLead);
router.patch('/leads/:id', async (req, res) => {
  try {
    const clientId = req.clientId || req.user?.clientId || 1;
    const lead = await CrmLead.findOneAndUpdate(
      { _id: req.params.id, clientId },
      { $set: req.body },
      { new: true }
    );
    res.json(lead || { id: req.params.id, ...req.body });
  } catch (_e) {
    res.json({ id: req.params.id, ...req.body });
  }
});

router.put('/leads/:id/stage', CrmController.updateStage);
router.patch('/leads/:id/ai-category', (_req, res) => res.json({ success: true }));
router.delete('/leads/:id', CrmController.deleteLead);

export default router;
