import { Router } from 'express';
import auth from '../middleware/auth';
import * as usersController from '../controllers/usersController';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.me);

// Користувачі (керування) — делегують у usersController
router.get('/users', usersController.list);
router.delete('/users/:id', auth, usersController.remove);
router.patch('/users/:id/role', auth, usersController.changeRole);
router.patch('/profile', auth, usersController.updateProfile);
router.get('/check-handle/:handle', usersController.checkHandle);

export default router;
