import { Router } from 'express';
import * as projectsController from '../controllers/projectsController';

const router = Router();

router.get('/', projectsController.list);
router.post('/', projectsController.create);
router.delete('/:id', projectsController.remove);

export default router;
