const Influencer = require('../models/influencer');
const Client = require('../models/client');
const User = require('../models/user');

// Helper function to format month names
const getMonthName = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
};

// Get last 6 months for trends
const getLast6Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            month: getMonthName(date),
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        });
    }
    return months;
};

// @desc    Get dashboard data for logged-in user
// @route   GET /api/dashboard/user
// @access  Private
exports.getDashboardForUser = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('User ID from token:', req.user.id);
        console.log('Finding influencers for user:', req.user.id);

        // Fetch all influencers for this user
        const influencers = await Influencer.find({ createdBy: userId }).sort({ createdAt: -1 });
        console.log('Found influencers:', influencers.length);

        // Fetch all clients for this user
        const clients = await Client.find({ createdBy: userId }).sort({ createdAt: -1 });
        console.log('Found clients:', clients.length);

        // Calculate stats
        let totalFollowers = 0;
        let totalEngagementRate = 0;
        let engagementCount = 0;
        let activeInfluencers = 0;
        let inactiveInfluencers = 0;
        const platformBreakdown = {};
        const nicheCount = {};

        influencers.forEach(inf => {
            if (inf.platforms && Array.isArray(inf.platforms)) {
                inf.platforms.forEach(platform => {
                totalFollowers += platform.followers || 0;
                
                if (platform.metrics?.engagementRate) {
                    totalEngagementRate += platform.metrics.engagementRate;
                    engagementCount++;
                }

                if (platform.status === 'Active') activeInfluencers++;
                else inactiveInfluencers++;

                // Platform breakdown
                if (!platformBreakdown[platform.platformName]) {
                    platformBreakdown[platform.platformName] = { count: 0, totalFollowers: 0 };
                }
                platformBreakdown[platform.platformName].count++;
                platformBreakdown[platform.platformName].totalFollowers += platform.followers || 0;

                // Niche distribution
                const niche = platform.niche || 'General';
                if (!nicheCount[niche]) nicheCount[niche] = 0;
                nicheCount[niche]++;
                });
            }
        });

        const avgEngagementRate = engagementCount > 0 ? (totalEngagementRate / engagementCount).toFixed(1) : 0;

        // Client stats
        let activeClients = 0;
        let inactiveClients = 0;
        let clientBudgetTotal = 0;

        clients.forEach(client => {
            if (client.status === 'Active') activeClients++;
            else inactiveClients++;
            clientBudgetTotal += client.stats?.budget || 0;
        });

        // Format platform breakdown
        const platformBreakdownArray = Object.entries(platformBreakdown).map(([platform, data]) => ({
            platform,
            count: data.count,
            totalFollowers: data.totalFollowers
        }));

        // Format niche distribution
        const influencersByNiche = Object.entries(nicheCount)
            .map(([niche, count]) => ({ niche, count }))
            .sort((a, b) => b.count - a.count);

        // Get recent influencers (last 5)
        const recentInfluencers = influencers.slice(0, 5).map(inf => ({
            _id: inf._id,
            name: inf.name,
            handle: inf.handle,
            platforms: inf.platforms && Array.isArray(inf.platforms) ? inf.platforms.map(p => p.platformName) : [],
            createdAt: inf.createdAt
        }));

        // Get recent clients (last 5)
        const recentClients = clients.slice(0, 5).map(client => ({
            _id: client._id,
            name: client.name,
            campaign: client.campaign,
            status: client.status,
            createdAt: client.createdAt
        }));

        // Calculate engagement trend (last 6 months)
        const months6 = getLast6Months();
        const engagementTrend = months6.map(month => {
            const monthInfluencers = influencers.filter(inf => {
                const infDate = new Date(inf.createdAt);
                return infDate >= month.startDate && infDate <= month.endDate;
            });

            let totalEng = 0;
            let count = 0;
            monthInfluencers.forEach(inf => {
                if (inf.platforms && Array.isArray(inf.platforms)) {
                    inf.platforms.forEach(p => {
                    if (p.metrics?.engagementRate) {
                        totalEng += p.metrics.engagementRate;
                        count++;
                    }
                    });
                }
            });

            return {
                month: month.month,
                avgEngagement: count > 0 ? parseFloat((totalEng / count).toFixed(1)) : 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalInfluencers: influencers.length,
                    totalClients: clients.length,
                    totalFollowers,
                    avgEngagementRate: parseFloat(avgEngagementRate),
                    activeInfluencers,
                    inactiveInfluencers,
                    activeClients,
                    inactiveClients
                },
                platformBreakdown: platformBreakdownArray,
                recentInfluencers,
                recentClients,
                clientBudgetTotal,
                engagementTrend,
                influencersByNiche
            }
        });
    } catch (error) {
        console.error('User Dashboard Error Details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
    }
};

// @desc    Get dashboard data for admin (all users data)
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getDashboardForAdmin = async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        // Fetch all influencers
        const influencers = await Influencer.find({}).sort({ createdAt: -1 });

        // Fetch all clients
        const clients = await Client.find({}).sort({ createdAt: -1 });

        // Calculate stats
        let totalFollowers = 0;
        let totalEngagementRate = 0;
        let engagementCount = 0;
        let activeInfluencers = 0;
        let inactiveInfluencers = 0;
        const platformBreakdown = {};
        const nicheCount = {};

        influencers.forEach(inf => {
            if (inf.platforms && Array.isArray(inf.platforms)) {
                inf.platforms.forEach(platform => {
                totalFollowers += platform.followers || 0;
                
                if (platform.metrics?.engagementRate) {
                    totalEngagementRate += platform.metrics.engagementRate;
                    engagementCount++;
                }

                if (platform.status === 'Active') activeInfluencers++;
                else inactiveInfluencers++;

                // Platform breakdown
                if (!platformBreakdown[platform.platformName]) {
                    platformBreakdown[platform.platformName] = { count: 0, totalFollowers: 0 };
                }
                platformBreakdown[platform.platformName].count++;
                platformBreakdown[platform.platformName].totalFollowers += platform.followers || 0;

                // Niche distribution
                const niche = platform.niche || 'General';
                if (!nicheCount[niche]) nicheCount[niche] = 0;
                nicheCount[niche]++;
                });
            }
        });

        const avgEngagementRate = engagementCount > 0 ? (totalEngagementRate / engagementCount).toFixed(1) : 0;

        // Client stats
        let activeClients = 0;
        let inactiveClients = 0;
        const clientsByStatus = { Active: { count: 0, totalBudget: 0 }, Inactive: { count: 0, totalBudget: 0 } };

        clients.forEach(client => {
            if (client.status === 'Active') {
                activeClients++;
                clientsByStatus.Active.count++;
                clientsByStatus.Active.totalBudget += client.stats?.budget || 0;
            } else {
                inactiveClients++;
                clientsByStatus.Inactive.count++;
                clientsByStatus.Inactive.totalBudget += client.stats?.budget || 0;
            }
        });

        // User role stats
        const adminCount = users.filter(u => u.role === 'admin').length;
        const regularUserCount = users.filter(u => u.role === 'user').length;

        // Top users by influencer count
        const userInfluencerCounts = {};
        influencers.forEach(inf => {
            if (!inf.createdBy) return;
            const userId = inf.createdBy.toString();
            if (!userInfluencerCounts[userId]) {
                userInfluencerCounts[userId] = 0;
            }
            userInfluencerCounts[userId]++;
        });

        const topUsersByInfluencers = users
            .map(user => ({
                userId: user._id,
                username: user.username,
                email: user.email,
                influencerCount: userInfluencerCounts[user._id.toString()] || 0
            }))
            .sort((a, b) => b.influencerCount - a.influencerCount)
            .slice(0, 10);

        // Format platform breakdown
        const platformBreakdownArray = Object.entries(platformBreakdown).map(([platform, data]) => ({
            platform,
            count: data.count,
            totalFollowers: data.totalFollowers
        }));

        // Format niche distribution (top 8)
        const influencersByNiche = Object.entries(nicheCount)
            .map(([niche, count]) => ({ niche, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // Recent data
        const recentUsers = users.slice(0, 5).map(user => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }));

        const recentInfluencers = influencers.slice(0, 5).map(inf => ({
            _id: inf._id,
            name: inf.name,
            handle: inf.handle,
            platforms: inf.platforms ? inf.platforms.map(p => p.platformName) : [],
            createdAt: inf.createdAt,
            createdBy: inf.createdBy
        }));

        const recentClients = clients.slice(0, 5).map(client => ({
            _id: client._id,
            name: client.name,
            campaign: client.campaign,
            status: client.status,
            stats: client.stats,
            createdAt: client.createdAt
        }));

        // Growth trends (last 6 months)
        const months6 = getLast6Months();
        
        const userGrowthTrend = months6.map(month => ({
            month: month.month,
            newUsers: users.filter(u => {
                const uDate = new Date(u.createdAt);
                return uDate >= month.startDate && uDate <= month.endDate;
            }).length
        }));

        const influencerGrowthTrend = months6.map(month => ({
            month: month.month,
            newInfluencers: influencers.filter(inf => {
                const infDate = new Date(inf.createdAt);
                return infDate >= month.startDate && infDate <= month.endDate;
            }).length
        }));

        // Add username to recent influencers
        const recentInfluencersWithUser = recentInfluencers.map(inf => {
            const user = inf.createdBy ? users.find(u => u._id.toString() === inf.createdBy.toString()) : null;
            return {
                ...inf,
                importedBy: user ? user.username : 'Unknown'
            };
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers: users.length,
                    totalInfluencers: influencers.length,
                    totalClients: clients.length,
                    totalFollowers,
                    avgEngagementRate: parseFloat(avgEngagementRate),
                    activeInfluencers,
                    inactiveInfluencers,
                    activeClients,
                    inactiveClients,
                    adminCount,
                    regularUserCount
                },
                platformBreakdown: platformBreakdownArray,
                topUsersByInfluencers,
                recentUsers,
                recentInfluencers: recentInfluencersWithUser,
                recentClients,
                userGrowthTrend,
                influencerGrowthTrend,
                clientsByStatus: [
                    { status: 'Active', count: clientsByStatus.Active.count, totalBudget: clientsByStatus.Active.totalBudget },
                    { status: 'Inactive', count: clientsByStatus.Inactive.count, totalBudget: clientsByStatus.Inactive.totalBudget }
                ],
                influencersByNiche
            }
        });
    } catch (error) {
        console.error('Admin Dashboard Error Details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
    }
};
