const mongoose = require('mongoose');

const InfluencerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    handle: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    platforms: {
        type: [String],
        enum: ['YouTube', 'TikTok', 'Instagram', 'Facebook'],
        default: ['Instagram']
    },
    followers: {
        type: Number,
        required: true,
        default: 0
    },
    niche: {
        type: String,
        default: "General"
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    metrics: {
        avgLikes: { type: Number, default: 0 },
        avgViews: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Influencer', InfluencerSchema);