const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.me);

// @route GET api/auth/users — список користувачів
router.get('/users', usersController.list);

// @route DELETE api/auth/users/:id — видалити користувача (тільки admin)
router.delete('/users/:id', auth, usersController.remove);

router.patch('/users/:id/role', auth, usersController.changeRole);
router.patch('/profile', auth, usersController.updateProfile);
router.get('/check-handle/:handle', usersController.checkHandle);


module.exports = router;
