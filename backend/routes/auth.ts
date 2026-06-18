import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import auth from '../middleware/auth';
import * as usersController from '../controllers/usersController';
import * as authController from '../controllers/authController';

const router = Router();

// Захист від брутфорсу: 10 спроб входу/реєстрації з одного IP за 15 хв
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Забагато спроб. Спробуйте за 15 хвилин.' },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authController.me);

// Користувачі (керування) — делегують у usersController
router.get('/users', usersController.list);
router.delete('/users/:id', auth, usersController.remove);
router.patch('/users/:id/role', auth, usersController.changeRole);
router.patch('/profile', auth, usersController.updateProfile);
router.get('/check-handle/:handle', usersController.checkHandle);

export default router;
