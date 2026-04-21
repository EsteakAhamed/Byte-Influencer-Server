const axios = require('axios');

const API_HOST = 'instagram-statistics-api.p.rapidapi.com';

exports.fetchProfile = async (igUrl) => {
    const response = await axios.get(
        `https://${API_HOST}/community`,
        {
            params: { url: igUrl },
            headers: {
                'x-rapidapi-host': API_HOST,
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            }
        }
    );
    return response.data.data;
};

exports.transformData = (data) => {
    const handle = `@${data.screenName}`;
    const followers = Number(String(data.usersCount || 0).replace(/,/g, ''));

    let avgLikes = Number(data.avgInteractions || 0);
    let avgViews = Number(data.avgViews || 0);
    let rawER = Number(data.avgER || 0);

    let engagementRate = rawER > 0
        ? (rawER * 100)
        : (followers > 0 ? (avgLikes / followers) * 100 : 0);

    if (avgViews === 0) {
        avgViews = avgLikes * 3;
    }

    return {
        name: data.name,
        handle,
        platforms: ["Instagram"],
        followers,
        niche: data.tags?.[0] || "Influencer",
        status: "Active",
        metrics: {
            avgLikes: Number(avgLikes.toFixed(0)),
            avgViews: Number(avgViews.toFixed(0)),
            engagementRate: Number(engagementRate.toFixed(2))
        }
    };
};
