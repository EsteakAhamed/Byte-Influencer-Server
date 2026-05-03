const Client = require('../models/client');

exports.getAll = async (req, res) => {
    try {
        // Enforce reasonable limits to prevent abuse
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
            });
        }

        // Regular users only see their own clients; admins see everything
        let query = {};
        if (req.user && req.user.role === 'user') {
            query.createdBy = req.user.id;
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

// Create new client and assign to current user
exports.create = async (req, res) => {
    const client = new Client({
        ...req.body,
        createdBy: req.user.id
    });
    try {
        const saved = await client.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        
        // Check ownership before allowing updates
        if (req.user.role === 'user' && client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this client' });
        }

        const updated = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        // Check ownership before allowing deletion
        if (req.user.role === 'user' && client.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this client' });
        }

        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
