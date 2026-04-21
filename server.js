require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const influencerRoutes = require('./routes/influencerRoutes.js');
const clientRoutes = require('./routes/clientRoutes.js');

const app = express();

// env validation
if (!process.env.RAPIDAPI_KEY) {
    console.warn('Missing RAPIDAPI_KEY');
}

if (!process.env.YOUTUBE_API_KEY) {
    console.warn('Missing YOUTUBE_API_KEY');
}

if (!process.env.FACEBOOK_API_KEY) {
    console.warn('Missing FACEBOOK_API_KEY');
}

// DB
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use('/api/influencers', influencerRoutes);
app.use('/api/clients', clientRoutes);

app.get('/', (req, res) => {
    res.send('API running');
});

// start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});