const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, deleteProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteProfile);
router.patch('/change-password', protect, changePassword); // Requires current password for security

module.exports = router;
