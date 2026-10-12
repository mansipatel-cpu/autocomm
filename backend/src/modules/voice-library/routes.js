import { Router } from 'express';
import { VoiceLibraryController } from './controller.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', VoiceLibraryController.getVoices);
router.get('/:id', VoiceLibraryController.getVoice);

export default router;
