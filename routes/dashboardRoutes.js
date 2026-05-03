const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getDashboardForUser, getDashboardForAdmin } = require('../controllers/dashboardController');

// User dashboard - any authenticated user
router.get('/user', protect, getDashboardForUser);

// Admin dashboard - admin only
router.get('/admin', protect, isAdmin, getDashboardForAdmin);

module.exports = router;
