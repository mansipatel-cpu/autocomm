import { Router } from 'express';
import { CrmController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

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
router.post('/leads', CrmController.createLead);
router.put('/leads/:id', CrmController.updateLead);
router.put('/leads/:id/stage', CrmController.updateStage);
router.patch('/leads/:id/ai-category', (_req, res) => res.json({ success: true }));
router.delete('/leads/:id', CrmController.deleteLead);

export default router;
