import { Router } from 'express';
import auth from '../middleware/auth';
import * as ticketsController from '../controllers/ticketsController';

const router = Router();

router.get('/', auth, ticketsController.list); // список (з фільтром доступу за роллю)
router.get('/:id', auth, ticketsController.getOne); // один тікет + активність
router.post('/', auth, ticketsController.create); // створити
router.post('/:id/comments', auth, ticketsController.addComment); // додати коментар
router.patch('/:id', auth, ticketsController.update); // оновити властивості
router.delete('/:id', auth, ticketsController.remove); // видалити тікет (+ його час)

export default router;
