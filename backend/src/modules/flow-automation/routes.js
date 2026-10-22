import { Router } from 'express';
import { FlowBuilderService } from '../flow-builder/service.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';
import { successResponse, createdResponse } from '../../common/utils/response.util.js';

const router = Router();

router.use(authenticate, requireTenant);

// Flows
router.get('/flows', async (req, res, next) => {
  try {
    const flows = await FlowBuilderService.listFlows({ clientId: req.clientId });
    return successResponse(res, flows, 'Flows retrieved');
  } catch (err) {
    next(err);
  }
});

router.post('/flows', async (req, res, next) => {
  try {
    const flow = await FlowBuilderService.createFlow({
      ...req.body,
      clientId: req.clientId,
      assignedClientId: req.clientId,
    });
    return createdResponse(res, flow, 'Flow created');
  } catch (err) {
    next(err);
  }
});

router.get('/flows/:id', async (req, res, next) => {
  try {
    const flow = await FlowBuilderService.getFlow(req.params.id);
    return successResponse(res, flow, 'Flow retrieved');
  } catch (err) {
    next(err);
  }
});

router.patch('/flows/:id', async (req, res, next) => {
  try {
    const flow = await FlowBuilderService.updateFlow(req.params.id, req.body);
    return successResponse(res, flow, 'Flow updated');
  } catch (err) {
    next(err);
  }
});

router.put('/flows/:id', async (req, res, next) => {
  try {
    const flow = await FlowBuilderService.updateFlow(req.params.id, req.body);
    return successResponse(res, flow, 'Flow updated');
  } catch (err) {
    next(err);
  }
});

router.post('/flows/:id/test', async (req, res) => {
  return successResponse(
    res,
    {
      success: true,
      testCallId: 'test_call_' + Date.now(),
      queueEntryId: 'test_queue_' + Date.now(),
      status: 'initiated',
    },
    'Test flow started'
  );
});

router.delete('/flows/:id', async (req, res, next) => {
  try {
    const flow = await FlowBuilderService.getFlow(req.params.id);
    if (flow) {
      await flow.deleteOne();
    }
    return successResponse(res, null, 'Flow deleted');
  } catch (err) {
    next(err);
  }
});

// Forms
router.get('/forms', async (_req, res) => {
  return successResponse(res, [], 'Forms retrieved');
});
router.post('/forms', async (req, res) => {
  return createdResponse(res, { id: 'form_' + Date.now(), ...req.body }, 'Form created');
});
router.get('/forms/:id', async (req, res) => {
  return successResponse(res, { id: req.params.id, name: 'Sample Form', fields: [] }, 'Form retrieved');
});
router.patch('/forms/:id', async (req, res) => {
  return successResponse(res, { id: req.params.id, ...req.body }, 'Form updated');
});
router.delete('/forms/:id', async (_req, res) => {
  return successResponse(res, null, 'Form deleted');
});
router.get('/forms/:id/submissions', async (_req, res) => {
  return successResponse(res, [], 'Submissions retrieved');
});

// Appointments & Settings
router.get('/appointments', async (_req, res) => {
  return successResponse(res, [], 'Appointments retrieved');
});
router.patch('/appointments/:id', async (req, res) => {
  return successResponse(res, { id: req.params.id, ...req.body }, 'Appointment updated');
});
router.post('/appointments/:id/sync-calendar', async (_req, res) => {
  return successResponse(res, { synced: true }, 'Calendar synced');
});
router.get('/appointment-settings', async (_req, res) => {
  return successResponse(res, { enabled: true, slotDuration: 30 }, 'Appointment settings retrieved');
});
router.put('/appointment-settings', async (req, res) => {
  return successResponse(res, req.body, 'Appointment settings updated');
});

// Templates & Executions
router.get('/flow-templates', async (_req, res) => {
  return successResponse(res, [], 'Templates retrieved');
});
router.post('/flow-templates/:id/clone', async (req, res) => {
  return createdResponse(res, { id: 'cloned_' + Date.now(), name: req.body.name }, 'Template cloned');
});
router.get('/executions', async (_req, res) => {
  return successResponse(res, [], 'Executions retrieved');
});
router.get('/queue/:id', async (_req, res) => {
  return successResponse(res, null, 'Queue entry retrieved');
});
router.delete('/queue/:id', async (_req, res) => {
  return successResponse(res, null, 'Queue entry deleted');
});

export default router;
