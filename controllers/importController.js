const Influencer = require('../models/influencer');
const instagramService = require('../services/instagramService');
const youtubeService = require('../services/youtubeService');
const facebookService = require('../services/facebookService');
const tiktokService = require('../services/tiktokService');

const normalizeHandle = (handle) => {
    if (!handle) return '';
    // Lowercase, trim, remove some special characters (keep a-z, 0-9, _, .)
    return handle.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();
};

const handleImport = async (influencerData, platformName, userId) => {
    const normalizedHandle = normalizeHandle(influencerData.handle);
    const searchName = influencerData.name ? new RegExp(`^${influencerData.name}$`, 'i') : null;

    let existing = await Influencer.findOne({ handle: normalizedHandle });

    if (!existing && searchName) {
        existing = await Influencer.findOne({ name: searchName });
    }

    const newPlatformData = {
        platformName,
        followers: influencerData.followers || 0,
        niche: influencerData.niche || 'General',
        status: influencerData.status || 'Active',
        metrics: influencerData.metrics || { avgLikes: 0, avgViews: 0, engagementRate: 0 }
    };

    if (existing) {
        const platformIndex = existing.platforms.findIndex(p => p.platformName === platformName);
        if (platformIndex > -1) {
            existing.platforms[platformIndex] = newPlatformData;
            existing.markModified('platforms');
        } else {
            existing.platforms.push(newPlatformData);
        }
        const saved = await existing.save();
        return { status: 200, message: "Influencer updated", influencer: saved };
    }

    const newInfluencer = new Influencer({
        name: influencerData.name,
        handle: normalizedHandle,
        platforms: [newPlatformData],
        createdBy: userId
    });
    
    const saved = await newInfluencer.save();
    return { status: 201, message: "Imported", influencer: saved };
};

exports.importInstagram = async (req, res) => {
    const { igUrl } = req.body;

    if (!igUrl?.includes('instagram.com')) {
        return res.status(400).json({ message: "Invalid Instagram URL" });
    }

    try {
        const rawData = await instagramService.fetchProfile(igUrl);
        const influencerData = instagramService.transformData(rawData);

        const result = await handleImport(influencerData, 'Instagram', req.user.id);
        res.status(result.status).json({ message: result.message, influencer: result.influencer });

    } catch (err) {
        console.error('Instagram import error:', err.response?.data || err.message);
        res.status(500).json({ message: "Import failed", error: err.message });
    }
};

exports.importYouTube = async (req, res) => {
    const { ytInput } = req.body;

    if (!ytInput) {
        return res.status(400).json({ message: "YouTube input required" });
    }

    try {
        const influencerData = await youtubeService.fetchProfile(ytInput);
        const result = await handleImport(influencerData, 'YouTube', req.user.id);
        res.status(result.status).json({ message: result.message, influencer: result.influencer });

    } catch (err) {
        console.error('YouTube import error:', err.response?.data || err.message);
        res.status(500).json({ message: "YouTube import failed", error: err.message });
    }
};

exports.importFacebook = async (req, res) => {
    const { fbUrl } = req.body;

    if (!fbUrl?.includes('facebook.com')) {
        return res.status(400).json({ message: "Invalid Facebook URL" });
    }

    try {
        const rawData = await facebookService.fetchProfile(fbUrl);
        const influencerData = facebookService.transformData(rawData);

        const result = await handleImport(influencerData, 'Facebook', req.user.id);
        res.status(result.status).json({ message: result.message, influencer: result.influencer });

    } catch (err) {
        console.error('Facebook import error:', err.response?.data || err.message);
        const { status, message } = facebookService.handleApiError(err);
        res.status(status).json({ message, error: err.message });
    }
};

exports.importTikTok = async (req, res) => {
    const { url } = req.body;

    if (!url?.includes('tiktok.com') && !url?.startsWith('@')) {
        return res.status(400).json({ message: "Invalid TikTok URL" });
    }

    try {
        const rawData = await tiktokService.fetchProfile(url);
        const influencerData = tiktokService.transformData(rawData);

        const result = await handleImport(influencerData, 'TikTok', req.user.id);
        res.status(result.status).json({ message: result.message, influencer: result.influencer });

    } catch (err) {
        console.error('TikTok import error:', err.response?.data || err.message);
        res.status(500).json({ message: "Import failed", error: err.message });
    }
};
