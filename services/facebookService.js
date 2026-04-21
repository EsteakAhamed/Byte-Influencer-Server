const axios = require('axios');

const API_HOST = 'facebook-scraper-api4.p.rapidapi.com';

exports.fetchProfile = async (fbUrl) => {
    if (!process.env.FACEBOOK_API_KEY) {
        throw new Error("FACEBOOK_API_KEY not configured");
    }

    const response = await axios.get(
        `https://${API_HOST}/get_facebook_pages_details_from_link`,
        {
            params: {
                link: fbUrl,
                exact_followers_count: 'true',
                show_verified_badge: 'false'
            },
            headers: {
                'x-rapidapi-host': API_HOST,
                'x-rapidapi-key': process.env.FACEBOOK_API_KEY,
                'Content-Type': 'application/json'
            }
        }
    );

    const pages = response.data;

    if (!Array.isArray(pages) || pages.length === 0) {
        throw new Error("No Facebook pages found for this URL");
    }

    return pages[0];
};

exports.transformData = (data) => {
    const urlMatch = data.url?.match(/facebook\.com\/([^/?]+)/);
    const username = urlMatch ? urlMatch[1] : data.ad_page_id;
    const handle = username ? `@${username}` : `@fb_${Date.now()}`;
    const followers = Number(data.followers_count || 0);

    // Estimate engagement (API doesn't provide metrics directly)
    const estimatedEngagementRate = 2.5;
    const avgLikes = Math.floor(followers * (estimatedEngagementRate / 100));
    const avgViews = Math.floor(followers * 0.08);
    const engagementRate = avgViews > 0 ? (avgLikes / avgViews) * 100 : estimatedEngagementRate;

    const category = Array.isArray(data.category)
        ? data.category.filter(c => c !== "Page").join(', ') || "Social Media"
        : data.category || "Social Media";

    return {
        name: data.title || data.name || username || "Facebook User",
        handle,
        platforms: ["Facebook"],
        followers,
        niche: category,
        status: "Active",
        metrics: {
            avgLikes,
            avgViews,
            engagementRate: Number(engagementRate.toFixed(2))
        }
    };
};

exports.handleApiError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
        return { status: 401, message: "Invalid or expired FACEBOOK_API_KEY" };
    }
    if (err.response?.status === 404) {
        return { status: 404, message: "Facebook profile not found" };
    }
    if (err.response?.status === 429) {
        return { status: 429, message: "API rate limit exceeded" };
    }
    return {
        status: 500,
        message: err.response?.data?.message || err.message || "Import failed"
    };
};
