const mongoose = require('mongoose');

const InfluencerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    handle: {
        type: String,
        required: [true, 'Please add a social handle'],
        unique: true 
    },
    platforms: {
        type: [String],
        required: true,
        enum: ['YouTube', 'TikTok', 'Instagram', 'Facebook']
    },
    followers: {
        type: String,
        required: true
    },
    niche: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    // Data structure from RapidAPI
    metrics: {
        avgLikes: { type: String, default: '0' },
        avgViews: { type: String, default: '0' },
        engagementRate: { type: String, default: '0%' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Influencer', InfluencerSchema);