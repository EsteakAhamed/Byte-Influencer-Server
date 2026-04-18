require('dotenv').config(); // 1. Load environment variables
const express = require('express');
const connectDB = require('./config/db');

const app = express();

connectDB();

// Middleware to parse JSON
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Byte Influencer API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running${PORT}`);
});