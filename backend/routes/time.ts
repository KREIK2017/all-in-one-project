import { Router } from 'express';
import * as timeController from '../controllers/timeController';

const router = Router();

router.get('/billing', timeController.billing);
router.post('/start', timeController.start);
router.post('/stop', timeController.stop);
router.get('/active/:user_id', timeController.active);
router.post('/manual', timeController.manual);
router.patch('/entries/:id', timeController.editEntry);

export default router;
