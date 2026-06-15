const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');

router.get('/', projectsController.list);
router.post('/', projectsController.create);
router.delete('/:id', projectsController.remove);

module.exports = router;
