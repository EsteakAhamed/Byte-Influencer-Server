const axios = require('axios');

const cache = new Map();

const extractChannelId = async (inputStr) => {
    if (cache.has(inputStr)) {
        return cache.get(inputStr);
    }

    let channelId = null;

    if (inputStr.includes('/channel/')) {
        const match = inputStr.match(/\/channel\/([a-zA-Z0-9_-]+)/);
        if (match) channelId = match[1];
    } else if (inputStr.includes('@') || inputStr.includes('/c/') || !inputStr.startsWith('UC')) {
        let queryStr = inputStr;
        const atMatch = inputStr.match(/@([a-zA-Z0-9_-]+)/);
        const cMatch = inputStr.match(/\/c\/([a-zA-Z0-9_-]+)/);

        if (atMatch) queryStr = atMatch[1];
        else if (cMatch) queryStr = cMatch[1];

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: queryStr,
                type: 'channel',
                maxResults: 1,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        if (searchRes.data.items?.length > 0) {
            channelId = searchRes.data.items[0].snippet.channelId;
        }
    } else {
        channelId = inputStr;
    }

    if (channelId) cache.set(inputStr, channelId);
    return channelId;
};

const fetchChannelStats = async (channelId) => {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
            part: 'snippet,statistics,contentDetails',
            id: channelId,
            key: process.env.YOUTUBE_API_KEY
        }
    });
    return response.data.items?.[0];
};

const fetchRecentVideoMetrics = async (uploadsPlaylistId, channelVideoCount) => {
    if (!uploadsPlaylistId || channelVideoCount === 0) {
        return { avgLikes: 0, avgViews: 0 };
    }

    try {
        const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
            params: {
                part: 'snippet',
                playlistId: uploadsPlaylistId,
                maxResults: 10,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const videoItems = playlistRes.data.items || [];
        if (videoItems.length === 0) return { avgLikes: 0, avgViews: 0 };

        const videoIds = videoItems.map(item => item.snippet.resourceId.videoId).join(',');

        const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'statistics',
                id: videoIds,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const validVideos = videosRes.data.items || [];
        if (validVideos.length === 0) return { avgLikes: 0, avgViews: 0 };

        let totalLikes = 0;
        let totalViews = 0;

        for (const vid of validVideos) {
            totalLikes += Number(vid.statistics.likeCount || 0);
            totalViews += Number(vid.statistics.viewCount || 0);
        }

        return {
            avgLikes: totalLikes / validVideos.length,
            avgViews: totalViews / validVideos.length
        };
    } catch (err) {
        console.error("Failed to fetch YouTube video metrics:", err.message);
        return { avgLikes: 0, avgViews: 0 };
    }
};

exports.fetchProfile = async (ytInput) => {
    const channelId = await extractChannelId(ytInput.trim());
    if (!channelId) throw new Error("Channel not found");

    const channel = await fetchChannelStats(channelId);
    if (!channel) throw new Error("Channel not found in API");

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    const videoCount = Number(channel.statistics.videoCount) || 1;
    const totalViews = Number(channel.statistics.viewCount) || 0;

    let { avgLikes, avgViews } = await fetchRecentVideoMetrics(uploadsPlaylistId, videoCount);

    if (avgViews === 0) {
        avgViews = Math.floor(totalViews / Math.max(videoCount, 1));
        if (avgViews === 0) avgViews = 100;
    }

    if (avgLikes === 0) {
        avgLikes = avgViews / 30;
    }

    const engagementRate = avgViews > 0 ? (avgLikes / avgViews) * 100 : 0;

    return {
        name: channel.snippet.title,
        handle: channel.snippet.customUrl
            ? `@${channel.snippet.customUrl.replace('@', '')}`
            : `yt_${channelId}`,
        platforms: ["YouTube"],
        followers: Number(channel.statistics.subscriberCount) || 0,
        niche: "YouTube Creator",
        status: "Active",
        metrics: {
            avgLikes: Number(avgLikes.toFixed(0)),
            avgViews: Number(avgViews.toFixed(0)),
            engagementRate: Number(engagementRate.toFixed(2))
        }
    };
};
