const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check for duplicate email
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(`Register Error: ${error.message}`);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Sign JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(`Login Error: ${error.message}`);
        res.status(500).json({ message: "Server error during login" });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error(`Get Profile Error: ${error.message}`);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

// @desc    Update user profile (username only)
// @route   PATCH /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.username = username;
        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error(`Update Profile Error: ${error.message}`);
        res.status(500).json({ message: "Server error updating profile" });
    }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await User.findByIdAndDelete(req.user.id);
        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error(`Delete Profile Error: ${error.message}`);
        res.status(500).json({ message: "Server error deleting profile" });
    }
};
