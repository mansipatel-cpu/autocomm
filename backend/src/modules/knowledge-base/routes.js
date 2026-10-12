import { Router } from 'express';
import { KnowledgeBaseController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', KnowledgeBaseController.listSources);
router.post('/url', KnowledgeBaseController.addUrlSource);
router.post('/text', KnowledgeBaseController.addTextSource);
router.post('/file', KnowledgeBaseController.addFileSource);
router.put('/:id/sync', KnowledgeBaseController.syncSource);
router.delete('/:id', KnowledgeBaseController.deleteSource);

export default router;
