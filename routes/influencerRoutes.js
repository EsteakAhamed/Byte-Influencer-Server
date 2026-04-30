const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const importController = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Core CRUD Routes
router.get('/', influencerController.getAll);
router.get('/:id/profile', influencerController.getProfile);
router.delete('/:id', influencerController.remove);
router.delete('/:id/platform/:platformName', influencerController.removePlatform);
router.patch('/:id', influencerController.update);

// Import Routes
router.post('/import-ig', importController.importInstagram);
router.post('/import-youtube', importController.importYouTube);
router.post('/import-facebook', importController.importFacebook);
router.post('/import-tiktok', importController.importTikTok);

module.exports = router;