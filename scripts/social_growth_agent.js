const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

// --- CONFIG ---
const GROUP_URL = 'https://www.facebook.com/groups/373733806854468';
const USER_DATA_DIR = path.join(__dirname, '..', 'temp_chrome_profile');
const SCROLL_PAGES = 5;

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceRoleKey);

// --- GEMINI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function analyzePost(text) {
    const prompt = `
    Analyze this social media post from a sim racing group.
    Return ONLY a JSON object with strictly these fields:
    {
        "type": "job" | "candidate" | "irrelevant",
        "confidence": number (0-1),
        "name": string (extracted name of person or team, or null),
        "role": string (e.g. "Driver", "GT3 Specialist", "Team Manager", or null),
        "skills": string[] (list of skills, car classes, or requirements),
        "summary": string (brief summary of what they want)
    }

    Post: "${text.replace(/"/g, '\\"')}"
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonStr = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error analyzing post with Gemini:', e.message);
        return null;
    }
}


// --- RESEARCH AGENT CAPABILITIES ---
async function researchCandidate(name, browser) {
    console.log(`🔎 Researching Candidate: ${name}...`);
    const page = await browser.newPage();
    let bio = null;
    let avatar_url = null;
    let location = null;
    let profileLink = null;

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 1. Search Google for Bio & Profile Link
        const bioQuery = encodeURIComponent(`${name} racing driver bio`);
        await page.goto(`https://www.google.com/search?q=${bioQuery}`, { waitUntil: 'domcontentloaded' });

        // Try to extract Featured Snippet or Description
        bio = await page.evaluate(() => {
            const snippet = document.querySelector('.hgKElc') || document.querySelector('.VwiC3b');
            return snippet ? snippet.innerText : null;
        });

        if (!bio) {
            // Fallback to first result description
            bio = await page.evaluate(() => {
                const results = document.querySelectorAll('.VwiC3b');
                return results.length > 0 ? results[0].innerText : null;
            });
        }

        // Try to find a profile link (DriverDB, Wikipedia, Team Site)
        profileLink = await page.evaluate(() => {
            const link = document.querySelector('a[href*="driverdb.com"], a[href*="wikipedia.org"]');
            return link ? link.href : null;
        });

        // 3. Extract Social Links
        const socialLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            const socialDomains = ['instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'youtube.com', 'tiktok.com'];
            const found = [];

            links.forEach(link => {
                const href = link.href;
                if (socialDomains.some(d => href.includes(d)) && !href.includes('google.com')) {
                    // Start simplified check
                    if (!found.includes(href)) found.push(href);
                }
            });
            // Return top 3 distinct
            return found.slice(0, 3);
        });


        // 2. Search Google Images for Photo
        const imgQuery = encodeURIComponent(`${name} racing driver`);
        await page.goto(`https://www.google.com/search?tbm=isch&q=${imgQuery}`, { waitUntil: 'domcontentloaded' });

        // ... (image logic) ...

    } catch (err) {
        console.error(`⚠️ Research failed for ${name}:`, err.message);
    } finally {
        // await page.close(); // Keep open for debugging if needed, or close
        if (page) await page.close();
    }

    return { bio, avatar_url, location, profileLink, social_links: socialLinks || [] };
}

async function runScraper() {
    console.log('🚀 Starting Social Growth Agent...');

    // 1. Launch Browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust if needed
        userDataDir: USER_DATA_DIR,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        console.log(`🔗 Navigating to ${GROUP_URL}...`);
        await page.goto(GROUP_URL, { waitUntil: 'networkidle2' });

        // Check for login selector (simplified)
        const loginButton = await page.$('div[aria-label="Accessible login button text"]');
        if (loginButton) {
            console.log('🔒 Login page detected. Waiting 60s for MANUAL login...');
            await new Promise(r => setTimeout(r, 60000));
        } else {
            console.log('✅ Appears logged in (or public view).');
        }

        console.log('📜 Scrolling feed...');
        for (let i = 0; i < SCROLL_PAGES; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log('🕷️ Extracting posts...');
        const posts = await page.evaluate(() => {
            const nodes = document.querySelectorAll('div[data-ad-preview="message"]');
            // Better Fallback: Look for text content containers that likely contain user posts
            // This is tricky, but usually post text is in a dir="auto" div inside a feed unit.
            const nodesFallback = nodes.length ? nodes : document.querySelectorAll('div[dir="auto"]');

            return Array.from(nodesFallback).map(el => {
                const text = el.innerText;
                // Simple hash for ID
                let hash = 0;
                for (let i = 0; i < text.length; i++) {
                    hash = ((hash << 5) - hash) + text.charCodeAt(i);
                    hash |= 0;
                }
                return {
                    external_id: 'fb_' + Math.abs(hash),
                    raw_content: text,
                    url: window.location.href // Rough approximation
                };
            }).filter(p => p.raw_content.length > 50);
        });

        console.log(`📥 Found ${posts.length} raw posts. Processing...`);

        for (const post of posts) {
            // Check existence
            const { data: existing } = await supabase
                .from('scraped_posts')
                .select('id')
                .eq('external_id', post.external_id)
                .single();

            if (existing) {
                console.log(`- Skipping duplicates ${post.external_id}`);
                continue;
            }

            // Insert Raw
            const { data: insertedPost, error: insertError } = await supabase
                .from('scraped_posts')
                .insert({
                    source: 'facebook',
                    external_id: post.external_id,
                    raw_content: post.raw_content,
                    url: post.url,
                    processed: true
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting raw post:', insertError);
                continue;
            }

            // Analyze
            const analysis = await analyzePost(post.raw_content);
            if (!analysis) continue;

            console.log(`🤖 Analysis [${analysis.type}]: ${analysis.name || 'Unknown'}`);

            if (analysis.type === 'candidate' && analysis.confidence > 0.7) {

                // --- TRIGGER RESEARCH AGENT ---
                let richData = {};
                if (analysis.name && analysis.name !== 'Unknown') {
                    richData = await researchCandidate(analysis.name, browser);
                }

                // Generate Public Username
                const baseUsername = (analysis.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
                const username = `${baseUsername}-${Math.floor(Math.random() * 1000)}`;

                // Insert Enriched Lead
                const { data: lead } = await supabase.from('leads').insert({
                    source_post_id: insertedPost.id,
                    name: analysis.name || 'Unknown Candidate',
                    role: analysis.role,
                    skills: analysis.skills,
                    status: 'new',
                    primary_skill: analysis.skills?.[0] || 'Sim Racing',
                    // Store Rich Data in Contact Info JSONB (Fallback Schema)
                    contact_info: {
                        username: username,
                        bio: richData.bio,
                        avatar_url: richData.avatar_url,
                        location: richData.location,
                        profile_link: richData.profileLink || post.url,
                        email: null // Would need email scraper for this
                    }
                }).select().single();

                if (lead) {
                    // Auto-Generate Claim Token (for demo)
                    const tokenString = 'claim_' + Math.random().toString(36).substring(7);
                    await supabase.from('claim_tokens').insert({
                        entity_type: 'lead',
                        entity_id: lead.id,
                        token: tokenString
                    });
                    console.log(`✨ Generated Claim Link for ${lead.name}: http://localhost:3000/claim/${tokenString}`);
                }

            } else if (analysis.type === 'job' && analysis.confidence > 0.7) {
                await supabase.from('jobs').insert({
                    source_post_id: insertedPost.id,
                    team_name: analysis.name || 'Unknown Team',
                    role: analysis.role,
                    description: analysis.summary,
                    requirements: analysis.skills,
                    status: 'open'
                });
            }
        }

        console.log('✅ Done processing.');

    } catch (err) {
        console.error('❌ Script failed:', err);
    } finally {
        // Keep browser open for debugging
        console.log('Leaving browser open. Press Ctrl+C to exit.');
    }
}

runScraper();
