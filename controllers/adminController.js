const User = require('../models/user');
const Influencer = require('../models/influencer');
const Client = require('../models/client');
const Notification = require('../models/notification');

// Password exclusion prevents credential exposure even if response is intercepted
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    // Email uniqueness check prevents login conflicts and account confusion
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
        // Self-deletion prevention stops accidental lockouts
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'You cannot delete your own account from here' });
        }

        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'User not found' });

        // Cascade delete prevents orphaned records that clutter the database
        await Influencer.deleteMany({ createdBy: req.params.id });
        await Client.deleteMany({ createdBy: req.params.id });
        await Notification.deleteMany({ recipientId: req.params.id });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Role validation whitelist prevents injection of invalid roles
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

// --- Assignment Controllers ---
// Assignment delegates edit rights without transferring ownership
// Creator retains credit, assignee gets working access

exports.assignInfluencer = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Admins cannot be assigned records' });

        const influencer = await Influencer.findById(req.params.influencerId);
        if (!influencer) return res.status(404).json({ message: 'Influencer not found' });

        if (influencer.assignedTo && influencer.assignedTo.toString() === userId) {
            return res.status(400).json({ message: 'Already assigned to this user' });
        }

        // Remove stale assignment notification for previous user
        if (influencer.assignedTo) {
            await Notification.deleteMany({
                relatedId: influencer._id,
                recipientId: influencer.assignedTo,
                type: 'assigned_influencer'
            });
        }

        influencer.assignedTo = userId;
        await influencer.save();

        // Notify the assigned user
        await Notification.create({
            type: 'assigned_influencer',
            recipientId: userId,
            relatedId: influencer._id,
            message: `You have been assigned the influencer "${influencer.name}".`
        });

        res.json(influencer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.unassignInfluencer = async (req, res) => {
    try {
        const influencer = await Influencer.findById(req.params.influencerId);
        if (!influencer) return res.status(404).json({ message: 'Influencer not found' });

        if (!influencer.assignedTo) {
            return res.status(400).json({ message: 'Influencer is not assigned to anyone' });
        }

        const previousUserId = influencer.assignedTo;
        influencer.assignedTo = null;
        await influencer.save();

        // Notify the previously assigned user
        await Notification.create({
            type: 'unassigned_influencer',
            recipientId: previousUserId,
            relatedId: influencer._id,
            message: `Your assignment to influencer "${influencer.name}" has been removed.`
        });

        res.json(influencer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.assignClient = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Admins cannot be assigned records' });

        const client = await Client.findById(req.params.clientId);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (client.assignedTo && client.assignedTo.toString() === userId) {
            return res.status(400).json({ message: 'Already assigned to this user' });
        }

        // Remove stale assignment notification for previous user
        if (client.assignedTo) {
            await Notification.deleteMany({
                relatedId: client._id,
                recipientId: client.assignedTo,
                type: 'assigned_client'
            });
        }

        client.assignedTo = userId;
        await client.save();

        // Notify the assigned user
        await Notification.create({
            type: 'assigned_client',
            recipientId: userId,
            relatedId: client._id,
            message: `You have been assigned the client "${client.name}".`
        });

        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.unassignClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (!client.assignedTo) {
            return res.status(400).json({ message: 'Client is not assigned to anyone' });
        }

        const previousUserId = client.assignedTo;
        client.assignedTo = null;
        await client.save();

        // Notify the previously assigned user
        await Notification.create({
            type: 'unassigned_client',
            recipientId: previousUserId,
            relatedId: client._id,
            message: `Your assignment to client "${client.name}" has been removed.`
        });

        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
