const express = require('express');
const router = express.Router();
const timeController = require('../controllers/timeController');

router.get('/billing', timeController.billing);
router.post('/start', timeController.start);
router.post('/stop', timeController.stop);
router.get('/active/:user_id', timeController.active);
router.post('/manual', timeController.manual);
router.patch('/entries/:id', timeController.editEntry);

module.exports = router;