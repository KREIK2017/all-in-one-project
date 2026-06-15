const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.get('/', auth, notificationsController.list);
router.get('/unread-count', auth, notificationsController.unreadCount);
router.patch('/read-all', auth, notificationsController.markAllRead);
router.patch('/:id/read', auth, notificationsController.markRead);

module.exports = router;