const Client = require('../models/client');
const User = require('../models/user');
const Notification = require('../models/notification');
const { buildReadQuery, requireEditPermission, requireDeletePermission } = require('../middleware/authorization');

exports.getAll = async (req, res) => {
    try {
        // Enforce reasonable limits to prevent abuse
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search?.trim();

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
            });
        }

        // All users can see all clients (new access model)
        let query = buildReadQuery();

        // Add search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                ...query,
                $or: [
                    { name: searchRegex },
                    { campaign: searchRegex }
                ]
            };
        }

        // Get count before applying pagination limits
        const totalCount = await Client.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        // Fetch paginated results with sort applied before skip/limit
        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: clients,
            pagination: {
                currentPage: page,
                limit: limit,
                totalCount: totalCount,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.create = async (req, res) => {
    // Store creator ID for ownership tracking
    const client = new Client({
        ...req.body,
        createdBy: req.user.id
    });
    try {
        const saved = await client.save();

        // Alert admins to user activity for oversight - reduces need for manual auditing
        if (req.user.role !== 'admin') {
            const admins = await User.find({ role: 'admin' }).select('_id');
            await Notification.insertMany(admins.map(admin => ({
                type: 'client_created',
                recipientId: admin._id,
                relatedId: saved._id,
                message: `User "${req.user.username}" created a new client "${saved.name}".`,
            })));
        }

        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        // Reuse centralized permission logic to avoid inconsistency bugs
        const permissionError = requireEditPermission(client, req.user);
        if (permissionError) {
            return res.status(permissionError.status).json({ message: permissionError.message });
        }

        const updated = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Keep admin visibility into user actions without blocking the operation
        if (req.user.role !== 'admin') {
            const admins = await User.find({ role: 'admin' }).select('_id');
            const notifications = admins.map(admin => ({
                type: 'client_updated',
                recipientId: admin._id,
                relatedId: updated._id,
                message: `User "${req.user.username}" updated client "${updated.name}".`,
            }));
            await Notification.insertMany(notifications);
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        // Delete is destructive so we restrict to admins only
        const permissionError = requireDeletePermission(req.user);
        if (permissionError) {
            return res.status(permissionError.status).json({ message: permissionError.message });
        }

        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
