import { Router } from 'express';
import auth from '../middleware/auth';
import * as notificationsController from '../controllers/notificationsController';

const router = Router();

router.get('/', auth, notificationsController.list);
router.get('/unread-count', auth, notificationsController.unreadCount);
router.patch('/read-all', auth, notificationsController.markAllRead);
router.patch('/:id/read', auth, notificationsController.markRead);

export default router;
