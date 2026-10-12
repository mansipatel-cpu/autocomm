import { Router } from 'express';
import { ContactController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireTenant } from '../../common/middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ContactController.list);
router.get('/stats', ContactController.stats);
router.post('/', ContactController.create);
router.post('/bulk-action', ContactController.bulkAction);
router.post('/import-csv', ContactController.importCsv);
router.put('/:id', ContactController.update);
router.delete('/:id', ContactController.delete);

export default router;
