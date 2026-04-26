const mongoose = require('mongoose');

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
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    platforms: {
        type: [PlatformSchema],
        default: [],
        validate: {
            validator: function (platforms) {
                // Prevent duplicate platform entries
                const names = platforms.map(p => p.platformName);
                return names.length === new Set(names).size;
            },
            message: 'Duplicate platform entries are not allowed'
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Influencer', InfluencerSchema);