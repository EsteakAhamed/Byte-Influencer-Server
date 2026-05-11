const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(isAdmin);

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/role', adminController.updateRole);

// --- Assignment Routes ---
router.post('/assign/influencer/:influencerId', adminController.assignInfluencer);
router.delete('/assign/influencer/:influencerId', adminController.unassignInfluencer);
router.post('/assign/client/:clientId', adminController.assignClient);
router.delete('/assign/client/:clientId', adminController.unassignClient);

module.exports = router;
