const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    campaign: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'], 
        default: 'Active' 
    },
    stats: {
        budget: { type: Number, default: 0 },
        influencersCount: { type: Number, default: 0 },
        reach: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        campaignDuration: {
            startDate: { type: Date },
            endDate: { type: Date }
        },
        conversions: { type: Number, default: 0 }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
