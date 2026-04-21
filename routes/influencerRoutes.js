const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const importController = require('../controllers/importController');

// Core CRUD Routes
router.get('/', influencerController.getAll);
router.delete('/:id', influencerController.remove);
router.patch('/:id', influencerController.update);

// Import Routes
router.post('/import-ig', importController.importInstagram);
router.post('/import-youtube', importController.importYouTube);
router.post('/import-facebook', importController.importFacebook);
router.post('/import-tiktok', importController.importTikTok);

module.exports = router;