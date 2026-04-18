const express = require('express');
const router = express.Router();    
const axios = require('axios');
const Influencer = require('../models/influencer.js');

router.get('/', async (req, res) => {
    try {
        const influencers = await Influencer.find().sort({ createdAt: -1 }); // Newest first
        res.json(influencers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/import-ig', async (req, res) => {
    const { igUrl } = req.body;

    const options = {
        method: 'GET',
        url: 'https://instagram-statistics-api.p.rapidapi.com/community',
        params: { url: igUrl },
        headers: {
            'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
    };

    try {
        const response = await axios.request(options);
        const data = response.data.data;

        const newInfluencer = new Influencer({
            name: data.name,
            handle: `@${data.screenName}`,
            platforms: ["Instagram"],
            followers: data.usersCount.toLocaleString(),
            niche: data.tags[2] || "Influencer",
            metrics: {
                avgLikes: data.avgInteractions.toString(),
                avgViews: data.avgViews.toString(),
                engagementRate: (data.avgER * 100).toFixed(2) + "%"
            }
        });

        const savedInfluencer = await newInfluencer.save();
        res.status(201).json(savedInfluencer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch Instagram data" });
    }
});

module.exports = router; 