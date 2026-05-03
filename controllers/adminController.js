const User = require('../models/user');
const Influencer = require('../models/influencer');
const Client = require('../models/client');

// Get all users for admin panel — exclude passwords from response
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user profile — check email isn't taken by someone else
exports.updateUser = async (req, res) => {
    try {
        const { username, email } = req.body;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (email) {
            // Prevent email collision with other users
            const existing = await User.findOne({ email });
            if (existing && existing._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            updateData.email = email;
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updated) return res.status(404).json({ message: 'User not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'You cannot delete your own account from here' });
        }

        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'User not found' });

        // Clean up all user data to prevent orphaned records
        await Influencer.deleteMany({ createdBy: req.params.id });
        await Client.deleteMany({ createdBy: req.params.id });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Promote or demote user — validate role is allowed
exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updated) return res.status(404).json({ message: 'User not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
