const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

// --- CONFIG ---
const PAGE_URL = 'https://www.facebook.com/gridpassapp';
const TARGET_GROUPS = [
    'https://www.facebook.com/groups/373733806854468', // Sim Racing Jobs
    'https://www.facebook.com/groups/simracinggeneral' // General
];
const SEARCH_QUERIES = ['Karting Center', 'Sim Racing Lounge', 'Race Track'];
const USER_DATA_DIR = path.join(__dirname, '..', 'temp_chrome_profile');

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// --- GEMINI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- AI HELPERS ---

async function analyzePost(text) {
    const prompt = `
    Analyze this Facebook post from a racing group.
    Return JSON: 
    { 
        "category": "job_seeker" | "hiring" | "classified" | "business_promo" | "discussion" | "spam",
        "confidence": number (0-1),
        "reason": "short explanation",
        "extracted_data": {
            "title": "string (for classifieds/jobs)",
            "price": number (for classifieds, or null),
            "location": "string (or null)",
            "item_name": "string (for classifieds)"
        }
    }
    Criteria:
    - "classified": Selling a sim rig, car part, or service.
    - "hiring": Job post / Team looking for driver.
    - "job_seeker": Driver looking for team.
    
    Post: "${text.replace(/"/g, '\\"').substring(0, 800)}"
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        return null; // Silent fail
    }
}

// --- BROWSER ---

async function startBrowser() {
    console.log('🚀 Starting GridPass Growth Agent with User Profile...');
    const { launchBrowser } = require('./browser_launcher');
    return await launchBrowser();
}

// --- ACTIONS ---

async function scanGroupsForLeads(page) {
    console.log('\n🕵️ SCANNING GROUPS for Candidates, Jobs & Classifieds...');

    for (const groupUrl of TARGET_GROUPS) {
        console.log(`   👉 Visiting: ${groupUrl}`);
        try {
            await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 4000));

            // Scroll
            for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollBy(0, 1000));
                await new Promise(r => setTimeout(r, 1500));
            }

            // Extract posts
            const posts = await page.$$('div[role="feed"] > div');
            console.log(`   Found ~${posts.length} posts in feed.`);

            let actionsTaken = 0;

            for (const post of posts) {
                if (actionsTaken >= 5) break;

                // Get Text
                const text = await page.evaluate(el => el.innerText, post);
                if (!text || text.length < 50) continue;

                // Analyze
                const insight = await analyzePost(text);

                if (insight && insight.confidence > 0.7) {
                    console.log(`     🎯 MATCH [${insight.category}]: ${insight.reason}`);

                    // Identify Author
                    let authorName = 'Unknown';
                    let authorUrl = '';
                    const userLink = await post.$('a[href*="/user/"], a[href*="profile.php"]');
                    if (userLink) {
                        authorName = await page.evaluate(el => el.innerText, userLink);
                        authorUrl = await page.evaluate(el => el.href, userLink);
                    }

                    // SAVE TO DB based on Category
                    if (insight.category === 'hiring' || insight.category === 'classified') {
                        // Save to scraped_listings
                        const type = insight.category === 'hiring' ? 'job' : 'classified';
                        const { error } = await supabase.from('scraped_listings').insert({
                            title: insight.extracted_data?.title || `${type.toUpperCase()}: ${text.substring(0, 30)}...`,
                            description: text,
                            price: insight.extracted_data?.price || 0,
                            origin_source: 'FACEBOOK_GROUP',
                            origin_author_name: authorName,
                            origin_url: authorUrl || groupUrl,
                            type: type,
                            status: 'new'
                        });
                        if (!error) console.log(`        💾 Saved to Scraped Listings (` + type + `)`);
                    } else if (insight.category === 'job_seeker') {
                        // Save to leads logic (or scraped_listings too?)
                        // Start with leads table if we want to invite them directly
                        // Or scanned_listings for review?
                        // Let's use LEADS table for people we want to invite.
                        const { error } = await supabase.from('leads').insert({
                            name: authorName,
                            role: 'Driver (Candidate)',
                            source_link: authorUrl,
                            status: 'new',
                            contact_info: { summary: insight.reason }
                        });
                        if (!error) console.log(`        💾 Saved to Leads`);

                        // Also try to friend request
                        if (userLink) {
                            // ... (Friend request logic remains if needed)
                            await friendRequestUser(page, userLink);
                        }
                    }

                    actionsTaken++;
                }
            }

        } catch (e) {
            console.error(`Error processing group ${groupUrl}:`, e.message);
        }
    }
}

async function friendRequestUser(page, userLinkElement) {
    try {
        await userLinkElement.hover();
        await new Promise(r => setTimeout(r, 2000));

        // This selector changes frequently. 
        const addBtn = await page.$('[aria-label="Add Friend"]');
        if (addBtn) {
            const vis = await page.evaluate(el => el.offsetParent !== null, addBtn);
            if (vis) {
                console.log('        ➕ Sending Friend Request...');
                await addBtn.click();
            }
        }
        await page.mouse.move(0, 0);
    } catch (err) { }
}

async function searchBusinesses(page) {
    console.log('\n🏢 SEARCHING FOR BUSINESSES (Tracks/Centers)...');

    for (const query of SEARCH_QUERIES) {
        console.log(`   🔍 Query: "${query}"`);
        const searchUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 4000));

        // Find Page Results
        // This selector targets page results in search. 
        // Often role="article" or specific classes. 
        // We'll try generic links that look like proper pages.
        const results = await page.$$('div[role="feed"] a[role="link"]');

        let found = 0;
        const processedLinks = new Set();

        for (const res of results) {
            if (found >= 3) break;
            const link = await page.evaluate(el => el.href, res);
            const name = await page.evaluate(el => el.innerText, res);

            if (link && !link.includes('/videos/') && !processedLinks.has(link) && name.length > 3) {
                // Heuristic: Is a page link
                processedLinks.add(link);
                console.log(`     📍 Proposed Business: ${name}`);

                // Save to Organizations (Prospects)
                const { error } = await supabase.from('organizations').insert({
                    name: name,
                    type: 'service', // guess
                    website: link,
                    status: 'active',
                    lead_status: 'prospect',
                    notes: `Scraped from Facebook search: ${query}`
                });

                if (!error) {
                    console.log(`        💾 Saved as Prospect Organization`);
                    found++;
                } else {
                    // console.log('Duplicate or error', error.message);
                }
            }
        }
    }
}

async function run() {
    const browser = await startBrowser();
    const page = await browser.newPage();

    // Check Login
    await page.goto(PAGE_URL);
    // await checkLogin(page);

    // 1. Group Growth (Drivers/Teams/Classifieds)
    await scanGroupsForLeads(page);

    // 2. Business Search (Tracks)
    await searchBusinesses(page);

    console.log('\n✅ Growth Cycle Complete.');
    console.log('Leaving browser open.');
}

run();
