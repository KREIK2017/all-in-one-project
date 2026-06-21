import { Router } from 'express';
import auth from '../middleware/auth';
import * as botController from '../controllers/botController';

const router = Router();

router.get('/status', auth, botController.status);
router.post('/start', auth, botController.start);
router.post('/stop', auth, botController.stop);

export default router;
