import { Router } from 'express';
import auth from '../middleware/auth';
import * as timeController from '../controllers/timeController';

const router = Router();

router.get('/billing', auth, timeController.billing);
router.post('/start', auth, timeController.start);
router.post('/stop', auth, timeController.stop);
router.get('/active/:user_id', auth, timeController.active);
router.post('/manual', auth, timeController.manual);
router.patch('/entries/:id', auth, timeController.editEntry);

export default router;
