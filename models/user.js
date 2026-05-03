const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        // Prevent weird characters that could cause issues in URLs
        match: [/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        index: true, // Speed up login lookups
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't accidentally leak password in queries
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user' // Everyone starts as regular user
    }
}, { timestamps: true });

// Hash password before saving — only if it was actually changed
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('User', UserSchema);
