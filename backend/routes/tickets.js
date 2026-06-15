const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ticketsController = require('../controllers/ticketsController');

router.get('/', auth, ticketsController.list);     // список (з фільтром доступу за роллю)
router.get('/:id', ticketsController.getOne);      // один тікет + активність
router.post('/', ticketsController.create);        // створити
router.post('/:id/comments', ticketsController.addComment); // додати коментар
router.patch('/:id', ticketsController.update);    // оновити властивості

module.exports = router;
