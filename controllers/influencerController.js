const Influencer = require('../models/influencer');

exports.getAll = async (req, res) => {
    try {
        const influencers = await Influencer.find().sort({ createdAt: -1 });
        res.json(influencers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const deleted = await Influencer.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Not found" });
        }
        res.json({ message: "Deleted", id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const body = req.body;
        const updateData = {};

        if (body.name) updateData.name = body.name;
        if (body.niche) updateData.niche = body.niche;
        if (body.status) updateData.status = body.status;

        if (body.followers !== undefined) {
            updateData.followers = Number(String(body.followers).replace(/,/g, ''));
        }

        if (body.metrics) {
            updateData.metrics = {
                avgLikes: Number(body.metrics.avgLikes || 0),
                avgViews: Number(body.metrics.avgViews || 0),
                engagementRate: Number(body.metrics.engagementRate || 0)
            };
        }

        const updated = await Influencer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
