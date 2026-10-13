import { Router } from 'express';
import { ContactController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ContactController.list);
router.get('/deduplicated', async (req, res, next) => {
  try {
    const { ContactService } = await import('./service.js');
    const result = await ContactService.listContacts({
      clientId: req.clientId,
      page: 1,
      limit: 1000,
    });
    const contacts = result?.contacts || (Array.isArray(result) ? result : []);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});
router.get('/stats', ContactController.stats);
router.post('/', ContactController.create);
router.post('/bulk-action', ContactController.bulkAction);
router.post('/import-csv', ContactController.importCsv);
router.put('/:id', ContactController.update);
router.delete('/:id', ContactController.delete);

export default router;
