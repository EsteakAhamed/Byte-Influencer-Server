const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/', clientController.getAll);
router.post('/', clientController.create);
router.patch('/:id', clientController.update);
router.delete('/:id', clientController.remove);

module.exports = router;
