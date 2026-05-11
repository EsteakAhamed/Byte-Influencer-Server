const mongoose = require('mongoose');
const Influencer = require('../models/influencer');
const User = require('../models/user');
const Notification = require('../models/notification');
const { buildReadQuery, requireEditPermission, requireDeletePermission } = require('../middleware/authorization');

const VALID_PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'Facebook'];

// Platform data is stored nested; we flatten it for the frontend to simplify component logic
// This prevents UI components from having to calculate averages and aggregations
const calculateTotals = (influencer) => {
    let totalFollowers = 0;
    let totalEngagement = 0;
    let platformCount = 0;
    
    let niches = new Set();
    let statuses = new Set();
    const platformsStr = [];
    const platformData = {};

    if (influencer.platforms && Array.isArray(influencer.platforms)) {
        influencer.platforms.forEach(p => {
            totalFollowers += (p.followers || 0);
            totalEngagement += (p.metrics?.engagementRate || 0);
            platformCount++;
            
            if (p.niche) niches.add(p.niche);
            if (p.status) statuses.add(p.status);
            
            platformsStr.push(p.platformName);
            platformData[p.platformName] = {
                followers: p.followers,
                avgLikes: p.metrics?.avgLikes || 0,
                avgViews: p.metrics?.avgViews || 0,
                engagementRate: p.metrics?.engagementRate || 0,
                status: p.status,
                niche: p.niche
            };
        });
    }

    const avgEngagement = platformCount > 0 ? (totalEngagement / platformCount) : 0;
    const primaryNiche = niches.size > 0 ? Array.from(niches)[0] : 'General';
    const primaryStatus = statuses.has('Active') ? 'Active' : 'Inactive';

    return {
        _id: influencer._id,
        name: influencer.name,
        handle: influencer.handle,
        platforms: platformsStr, // array of names for frontend compatibility
        platformData,
        followers: totalFollowers, // exposed for list view
        metrics: {
            engagementRate: avgEngagement,
            avgLikes: platformCount > 0 ? Object.values(platformData).reduce((sum, d) => sum + d.avgLikes, 0) / platformCount : 0,
            avgViews: platformCount > 0 ? Object.values(platformData).reduce((sum, d) => sum + d.avgViews, 0) / platformCount : 0,
        },
        niche: primaryNiche,
        status: primaryStatus,
        aggregated: {
            totalFollowers,
            avgEngagement,
            platformCount
        },
        createdAt: influencer.createdAt,
        updatedAt: influencer.updatedAt,
        createdBy: influencer.createdBy,
        assignedTo: influencer.assignedTo
    };
};

exports.getAll = async (req, res) => {
    try {
        // Validate pagination to prevent DB overload from malicious requests
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search?.trim();

        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({ 
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
            });
        }

        let query = buildReadQuery();

        // Case-insensitive regex search on name and handle
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                ...query,
                $or: [
                    { name: searchRegex },
                    { handle: searchRegex }
                ]
            };
        }

        // Separate count query is needed for accurate pagination metadata
        const totalCount = await Influencer.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        // Fetch paginated results with sort applied before skip/limit
        const influencers = await Influencer.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const mapped = influencers.map(inf => calculateTotals(inf));

        res.json({
            success: true,
            data: mapped,
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

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        let influencer;

        // Support both MongoDB ObjectId and handle lookup
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            influencer = await Influencer.findById(id);
        }

        // Fallback to handle search if ID lookup fails
        if (!influencer) {
            influencer = await Influencer.findOne({ handle: id });
        }

        if (!influencer) {
            return res.status(404).json({ message: 'Influencer not found' });
        }

        res.json(calculateTotals(influencer));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE entire influencer profile
exports.remove = async (req, res) => {
    try {
        // Only admins can delete
        const permissionError = requireDeletePermission(req.user);
        if (permissionError) {
            return res.status(permissionError.status).json({ message: permissionError.message });
        }

        const influencer = await Influencer.findById(req.params.id);
        if (!influencer) return res.status(404).json({ message: "Not found" });

        const deleted = await Influencer.findByIdAndDelete(req.params.id);
        res.json({ message: `${deleted.name}'s profile deleted`, id: req.params.id, deleted: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE a single platform from an influencer
exports.removePlatform = async (req, res) => {
    const { id, platformName } = req.params;
    const deleteIfEmpty = req.query.deleteIfEmpty === 'true';

    if (!VALID_PLATFORMS.includes(platformName)) {
        return res.status(400).json({ message: `Invalid platform: ${platformName}` });
    }

    try {
        const influencer = await Influencer.findById(id);
        if (!influencer) {
            return res.status(404).json({ message: 'Influencer not found' });
        }

        // Users can edit only their own or assigned
        const permissionError = requireEditPermission(influencer, req.user);
        if (permissionError) {
            return res.status(permissionError.status).json({ message: permissionError.message });
        }

        const hasPlatform = influencer.platforms.some(p => p.platformName === platformName);
        if (!hasPlatform) {
            return res.status(404).json({ message: `${platformName} not found on this influencer` });
        }

        // Use $pull to remove only the targeted platform entry
        const updated = await Influencer.findByIdAndUpdate(
            id,
            { $pull: { platforms: { platformName } } },
            { new: true }
        );

        // If no platforms remain and deleteIfEmpty is true, remove the entire document
        if (deleteIfEmpty && updated.platforms.length === 0) {
            await Influencer.findByIdAndDelete(id);
            return res.json({
                message: `${influencer.name}'s profile deleted (no platforms remaining)`,
                deleted: true,
                id
            });
        }

        res.json({
            message: `${platformName} removed from ${updated.name}`,
            deleted: false,
            influencer: calculateTotals(updated)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH — update identity fields and/or upsert a specific platform
exports.update = async (req, res) => {
    const { id } = req.params;
    const { name, handle, platformName, platformData } = req.body;

    // Validate platformName if provided
    if (platformName && !VALID_PLATFORMS.includes(platformName)) {
        return res.status(400).json({ message: `Invalid platform: ${platformName}. Must be one of: ${VALID_PLATFORMS.join(', ')}` });
    }

    // Validate platformData fields if provided
    if (platformData) {
        if (platformData.followers !== undefined && (typeof platformData.followers !== 'number' || platformData.followers < 0)) {
            return res.status(400).json({ message: 'followers must be a non-negative number' });
        }
        if (platformData.metrics) {
            const m = platformData.metrics;
            for (const key of ['avgLikes', 'avgViews', 'engagementRate']) {
                if (m[key] !== undefined && (typeof m[key] !== 'number' || m[key] < 0)) {
                    return res.status(400).json({ message: `metrics.${key} must be a non-negative number` });
                }
            }
        }
        if (platformData.status && !['Active', 'Inactive'].includes(platformData.status)) {
            return res.status(400).json({ message: 'status must be Active or Inactive' });
        }
    }

    const hasIdentityUpdate = name || handle;
    const hasPlatformUpdate = platformName && platformData;

    if (!hasIdentityUpdate && !hasPlatformUpdate) {
        return res.status(400).json({ message: 'No update data provided. Send name/handle for identity updates, or platformName + platformData for platform updates.' });
    }

    // Use a transaction when both identity and platform are updated together
    const needsTransaction = hasIdentityUpdate && hasPlatformUpdate;
    const session = needsTransaction ? await mongoose.startSession() : null;

    try {
        if (session) session.startTransaction();

        const influencer = await Influencer.findById(id).session(session || undefined);
        if (!influencer) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ message: 'Influencer not found' });
        }

        // Users can edit only their own or assigned
        const permissionError = requireEditPermission(influencer, req.user);
        if (permissionError) {
            if (session) await session.abortTransaction();
            return res.status(permissionError.status).json({ message: permissionError.message });
        }

        // Identity update
        if (hasIdentityUpdate) {
            if (name) influencer.name = name;
            if (handle) influencer.handle = handle;
        }

        // Platform upsert
        if (hasPlatformUpdate) {
            const existingIndex = influencer.platforms.findIndex(p => p.platformName === platformName);

            if (existingIndex > -1) {
                // Update existing platform — merge only provided fields
                const existing = influencer.platforms[existingIndex];
                if (platformData.followers !== undefined) existing.followers = platformData.followers;
                if (platformData.niche !== undefined) existing.niche = platformData.niche;
                if (platformData.status !== undefined) existing.status = platformData.status;
                if (platformData.metrics) {
                    if (!existing.metrics) existing.metrics = {};
                    if (platformData.metrics.avgLikes !== undefined) existing.metrics.avgLikes = platformData.metrics.avgLikes;
                    if (platformData.metrics.avgViews !== undefined) existing.metrics.avgViews = platformData.metrics.avgViews;
                    if (platformData.metrics.engagementRate !== undefined) existing.metrics.engagementRate = platformData.metrics.engagementRate;
                }
                influencer.platforms[existingIndex] = existing;
                influencer.markModified('platforms');
            } else {
                // New platform — push with defaults for missing fields
                influencer.platforms.push({
                    platformName,
                    followers: platformData.followers || 0,
                    niche: platformData.niche || 'General',
                    status: platformData.status || 'Active',
                    metrics: {
                        avgLikes: platformData.metrics?.avgLikes || 0,
                        avgViews: platformData.metrics?.avgViews || 0,
                        engagementRate: platformData.metrics?.engagementRate || 0
                    }
                });
            }
        }

        const saved = await influencer.save({ session: session || undefined });

        if (session) await session.commitTransaction();

        // Notify all admins when a regular user updates an influencer
        if (req.user.role !== 'admin') {
            const admins = await User.find({ role: 'admin' }).select('_id');
            const notifications = admins.map(admin => ({
                type: 'influencer_updated',
                recipientId: admin._id,
                relatedId: saved._id,
                message: `User "${req.user.username}" updated influencer "${saved.name}".`,
            }));
            await Notification.insertMany(notifications);
        }

        const actionLabel = hasPlatformUpdate
            ? (hasIdentityUpdate ? `Profile and ${platformName} updated` : `${platformName} stats updated successfully`)
            : 'Profile updated successfully';

        res.json({ message: actionLabel, influencer: calculateTotals(saved) });
    } catch (err) {
        if (session) await session.abortTransaction();

        // Return Mongoose validation errors cleanly
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join('. ') });
        }

        res.status(500).json({ message: err.message });
    } finally {
        if (session) session.endSession();
    }
};
