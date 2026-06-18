import { Router } from 'express';
import auth from '../middleware/auth';
import * as ticketsController from '../controllers/ticketsController';

const router = Router();

router.get('/', auth, ticketsController.list); // список (з фільтром доступу за роллю)
router.get('/:id', ticketsController.getOne); // один тікет + активність
router.post('/', ticketsController.create); // створити
router.post('/:id/comments', ticketsController.addComment); // додати коментар
router.patch('/:id', ticketsController.update); // оновити властивості
router.delete('/:id', ticketsController.remove); // видалити тікет (+ його час)

export default router;
