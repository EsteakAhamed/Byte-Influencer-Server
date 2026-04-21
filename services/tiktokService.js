const axios = require('axios');

const API_HOST = 'tiktok-api23.p.rapidapi.com';

const extractUsername = (url) => {
    const match = url.match(/@([^/?]+)/);
    return match ? match[1] : url;
};

exports.fetchProfile = async (url) => {
    const uniqueId = extractUsername(url);

    const response = await axios.get(
        `https://${API_HOST}/api/user/info`,
        {
            params: { uniqueId },
            headers: {
                'x-rapidapi-host': API_HOST,
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            }
        }
    );

    const userInfo = response.data?.userInfo;

    if (!userInfo) {
        throw new Error("User not found");
    }

    return userInfo;
};

exports.transformData = (data) => {
    const user = data.user;
    const stats = data.stats;

    const username = user.uniqueId;
    const handle = `@${username}`;
    const followers = Number(stats.followerCount || 0);
    const totalLikes = Number(stats.heartCount || 0);
    const videoCount = Number(stats.videoCount || 1);

    const avgLikes = Math.floor(totalLikes / Math.max(videoCount, 1));
    const avgViews = Math.floor(followers * 0.15);
    const engagementRate = avgViews > 0 ? (avgLikes / avgViews) * 100 : 5;

    return {
        name: user.nickname || username,
        handle,
        platforms: ["TikTok"],
        followers,
        niche: "TikTok Creator",
        status: "Active",
        metrics: {
            avgLikes,
            avgViews,
            engagementRate: Number(engagementRate.toFixed(2))
        }
    };
};
