const Influencer = require('../models/influencer');
const instagramService = require('../services/instagramService');
const youtubeService = require('../services/youtubeService');
const facebookService = require('../services/facebookService');
const tiktokService = require('../services/tiktokService');

exports.importInstagram = async (req, res) => {
    const { igUrl } = req.body;

    if (!igUrl?.includes('instagram.com')) {
        return res.status(400).json({ message: "Invalid Instagram URL" });
    }

    try {
        const rawData = await instagramService.fetchProfile(igUrl);
        const influencerData = instagramService.transformData(rawData);

        const existing = await Influencer.findOne({ handle: influencerData.handle });
        if (existing) {
            return res.json({ message: "Influencer already exists", influencer: existing });
        }

        const saved = await new Influencer(influencerData).save();
        res.status(201).json({ message: "Imported", influencer: saved });

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

        const existing = await Influencer.findOne({ handle: influencerData.handle });
        if (existing) {
            return res.json({ message: "Influencer already exists", influencer: existing });
        }

        const saved = await new Influencer(influencerData).save();
        res.status(201).json({ message: "YouTube influencer imported", influencer: saved });

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

        const existing = await Influencer.findOne({ handle: influencerData.handle });
        if (existing) {
            return res.json({ message: "Influencer already exists", influencer: existing });
        }

        const saved = await new Influencer(influencerData).save();
        res.status(201).json({ message: "Imported", influencer: saved });

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

        const existing = await Influencer.findOne({ handle: influencerData.handle });
        if (existing) {
            return res.json({ message: "Influencer already exists", influencer: existing });
        }

        const saved = await new Influencer(influencerData).save();
        res.status(201).json({ message: "Imported", influencer: saved });

    } catch (err) {
        console.error('TikTok import error:', err.response?.data || err.message);
        res.status(500).json({ message: "Import failed", error: err.message });
    }
};
