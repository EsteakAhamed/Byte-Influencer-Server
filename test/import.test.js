const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const Influencer = require('../models/influencer');
const importController = require('../controllers/importController');
const instagramService = require('../services/instagramService');
const youtubeService = require('../services/youtubeService');
require('dotenv').config({ path: __dirname + '/../.env' });

test('Import Controller Duplicate Handling', async (t) => {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/byte-influencer');

    // 2. Clear test user
    const testHandle = 'test_user_for_dup';
    await Influencer.deleteMany({ handle: testHandle });

    // 3. Mock the service
    const originalIgTransform = instagramService.transformData;
    const originalIgFetch = instagramService.fetchProfile;
    
    instagramService.fetchProfile = async () => ({ dummy: true });
    instagramService.transformData = () => ({
        name: 'Test Dup User',
        handle: testHandle,
        followers: 1000,
        niche: 'Dev',
        status: 'Active',
        metrics: { avgLikes: 10, avgViews: 100, engagementRate: 1 }
    });

    // 4. Test 1st import (Instagram)
    let resData1, status1;
    const res1 = {
        status: (code) => { status1 = code; return res1; },
        json: (data) => { resData1 = data; return res1; }
    };
    
    await importController.importInstagram({ body: { igUrl: 'instagram.com/test' } }, res1);
    assert.strictEqual(status1, 201, 'First import should return 201');
    assert.strictEqual(resData1.influencer.platforms.length, 1, 'Should have 1 platform');
    assert.strictEqual(resData1.influencer.platforms[0].platformName, 'Instagram');

    // 5. Test 2nd import (YouTube but same handle)
    const originalYtTransform = youtubeService.fetchProfile;
    youtubeService.fetchProfile = async () => ({
        name: 'Test Dup User',
        handle: testHandle, // same handle
        followers: 2000,
        platforms: ['YouTube'],
        niche: 'Dev',
        status: 'Active',
        metrics: { avgLikes: 20, avgViews: 200, engagementRate: 2 }
    });

    let resData2, status2;
    const res2 = {
        status: (code) => { status2 = code; return res2; },
        json: (data) => { resData2 = data; return res2; },
        send: () => {}
    };

    await importController.importYouTube({ body: { ytInput: 'test_user_for_dup' } }, res2);
    
    assert.strictEqual(status2, 200, 'Second import should return 200 (updated)');
    assert.strictEqual(resData2.influencer.platforms.length, 2, 'Should have appended to existing Platforms array');
    assert.strictEqual(resData2.influencer.platforms[1].platformName, 'YouTube');

    // Restore
    instagramService.transformData = originalIgTransform;
    instagramService.fetchProfile = originalIgFetch;
    youtubeService.fetchProfile = originalYtTransform;

    // Cleanup
    await Influencer.deleteMany({ handle: testHandle });
    await mongoose.disconnect();
});
