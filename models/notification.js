const mongoose = require('mongoose');

// Notification model — tracks assignment events and data mutations for role-aware alerts
const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                'assigned_influencer',   // user received an influencer assignment
                'unassigned_influencer', // user had an influencer assignment removed
                'assigned_client',       // user received a client assignment
                'unassigned_client',     // user had a client assignment removed
                'influencer_updated',    // admin alert: user updated an influencer
                'client_updated',        // admin alert: user updated a client
                'influencer_created',    // admin alert: new influencer imported/created
                'client_created',        // admin alert: new client created
            ],
            required: true,
        },
        message:   { type: String, required: true },  // human-readable, pre-composed on the server
        recipientId: {                                 // who receives this notification
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        relatedId: {                                   // optional: the influencer/client doc _id for linking
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        isRead:    { type: Boolean, default: false },  // toggled when user opens the notification panel
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
