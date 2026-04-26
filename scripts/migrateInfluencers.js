require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Influencer = require('../models/influencer');

const normalizeHandle = (handle) => {
    if (!handle) return '';
    return handle.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim();
};

async function migrate() {
    try {
        console.log("Connecting to mongo...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/byte-influencer');
        console.log("Connected.");
        
        const influencers = await Influencer.find({});
        console.log(`Found ${influencers.length} influencers to migrate.`);
        
        const mergedHandles = {};
        const docsToDelete = [];

        for (let doc of influencers) {
            const raw = doc.toObject();
            
            const normalizedHandle = normalizeHandle(raw.handle);
            const oldPlatformStrings = raw.platforms || [];
            
            let platformsToAdd = [];

            if (oldPlatformStrings.length > 0 && typeof oldPlatformStrings[0] === 'object') {
                platformsToAdd = oldPlatformStrings;
            } else {
                const primaryPlatform = oldPlatformStrings.length > 0 ? oldPlatformStrings[0] : 'Instagram';
                platformsToAdd = [{
                    platformName: primaryPlatform,
                    followers: raw.followers || 0,
                    niche: raw.niche || 'General',
                    status: raw.status || 'Active',
                    metrics: raw.metrics || { avgLikes: 0, avgViews: 0, engagementRate: 0 }
                }];
            }
            
            if (mergedHandles[normalizedHandle]) {
                const targetDoc = await Influencer.findById(mergedHandles[normalizedHandle]);
                if (targetDoc) {
                    platformsToAdd.forEach(p => {
                        if (!targetDoc.platforms.find(existingP => existingP.platformName === p.platformName)) {
                            targetDoc.platforms.push(p);
                        }
                    });
                    await targetDoc.save();
                    docsToDelete.push(doc._id);
                }
            } else {
                doc.platforms = platformsToAdd;
                doc.handle = normalizedHandle;
                await doc.save();
                mergedHandles[normalizedHandle] = doc._id;
            }
        }
        
        for (let id of docsToDelete) {
             await Influencer.findByIdAndDelete(id);
             console.log('Deleted duplicate doc', id);
        }
        
        console.log(`Successfully migrated. Merged ${docsToDelete.length} duplicates.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

migrate();
