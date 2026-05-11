require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const influencerRoutes = require('./routes/influencerRoutes.js');
const clientRoutes = require('./routes/clientRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');

const app = express();

// Warn about missing API keys — app still works but some features won't
if (!process.env.RAPIDAPI_KEY) {
    console.warn('Missing RAPIDAPI_KEY');
}

if (!process.env.YOUTUBE_API_KEY) {
    console.warn('Missing YOUTUBE_API_KEY');
}

if (!process.env.FACEBOOK_API_KEY) {
    console.warn('Missing FACEBOOK_API_KEY');
}

// Connect to MongoDB before starting server
connectDB();

// Enable CORS for frontend and parse JSON bodies
app.use(cors());
app.use(express.json());

// Mount route handlers at their respective paths
app.use('/api/influencers', influencerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.send('API running');
});

// Start listening on port from env or default to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});