const mongoose = require('mongoose');

// Stats for each platform — embedded doc so we don't need separate collection
const MetricsSchema = new mongoose.Schema({
    avgLikes: {
        type: Number,
        default: 0,
        min: [0, 'avgLikes cannot be negative']
    },
    avgViews: {
        type: Number,
        default: 0,
        min: [0, 'avgViews cannot be negative']
    },
    engagementRate: {
        type: Number,
        default: 0,
        min: [0, 'engagementRate cannot be negative']
    }
}, { _id: false });

// Each platform entry for an influencer — one influencer can have multiple platforms
const PlatformSchema = new mongoose.Schema({
    platformName: {
        type: String,
        enum: {
            values: ['YouTube', 'TikTok', 'Instagram', 'Facebook'],
            message: '{VALUE} is not a supported platform'
        },
        required: [true, 'platformName is required']
    },
    followers: {
        type: Number,
        required: [true, 'followers count is required'],
        default: 0,
        min: [0, 'followers cannot be negative']
    },
    niche: {
        type: String,
        default: "General",
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['Active', 'Inactive'],
            message: '{VALUE} is not a valid status'
        },
        default: 'Active'
    },
    metrics: {
        type: MetricsSchema,
        default: () => ({ avgLikes: 0, avgViews: 0, engagementRate: 0 })
    }
}, { _id: false });

const InfluencerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true
    },
    handle: {
        type: String,
        required: [true, 'handle is required'],
        unique: true, // Can't have two influencers with same handle
        index: true,
        lowercase: true,
        trim: true
    },
    platforms: {
        type: [PlatformSchema],
        default: [],
        validate: {
            validator: function (platforms) {
                // Don't let someone add Instagram twice for same influencer
                const names = platforms.map(p => p.platformName);
                return names.length === new Set(names).size;
            },
            message: 'Duplicate platform entries are not allowed'
        }
    },
    // Track who imported this so we can filter by owner
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Influencer', InfluencerSchema);