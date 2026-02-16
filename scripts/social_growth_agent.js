const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require("openai");

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const CONFIG = require('./growth_config.json');

// --- CONFIG ---
const GROUP_URL = CONFIG.facebook_groups[0]; // Default to first
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

// --- OPENAI SETUP ---
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function analyzePost(text) {
    const prompt = `
    Analyze this social media post from a sim racing group.
    Return ONLY a JSON object with strictly these fields:
    {
        "type": "job" | "candidate" | "tech_support" | "custom_tool" | "race_shop" | "collector" | "irrelevant",
        "confidence": number (0-1),
        "name": string (extracted name of person or team, or null),
        "role": string (e.g. "Driver", "GT3 Specialist", "Manager", "Collector"),
        "skills": string[] (list of skills, car classes, or requirements),
        "summary": string (brief summary of what they want),
        "needs_resume": boolean (true if they are a driver looking for a team and might benefit from a resume builder),
        "topic": string (key topic for tech support or custom tool, e.g. "triple monitors", "telemetry app")
    }

    Post: "${text.replace(/"/g, '\\"')}"
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        return JSON.parse(content);
    } catch (e) {
        console.error('Error analyzing post with OpenAI:', e.message);
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
    let socialLinks = [];

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
        socialLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            const socialDomains = ['instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'youtube.com', 'tiktok.com'];
            const found = [];

            links.forEach(link => {
                const href = link.href;
                if (socialDomains.some(d => href.includes(d)) && !href.includes('google.com')) {
                    if (!found.includes(href)) found.push(href);
                }
            });
            // Return top 3 distinct
            return found.slice(0, 3);
        });


        // 2. Search Google Images for Photo
        const imgQuery = encodeURIComponent(`${name} racing driver`);
        await page.goto(`https://www.google.com/search?tbm=isch&q=${imgQuery}`, { waitUntil: 'domcontentloaded' });

        // ... (image logic skipped for brevity as it wasn't strictly required/modified recently but kept placeholder)

    } catch (err) {
        console.error(`⚠️ Research failed for ${name}:`, err.message);
    } finally {
        if (page) await page.close();
    }

    return { bio, avatar_url, location, profileLink, social_links: socialLinks || [] };
}

// --- GROUP DISCOVERY AGENT ---
async function discoverGroups(browser) {
    console.log('🌍 logical-discovery: Scanning for new groups...');
    const page = await browser.newPage();
    const keywords = CONFIG.search_keywords || ['Sim Racing'];
    let joinedCount = 0;
    const MAX_JOINS = 2; // Very conservative limit to avoid bans

    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        for (const keyword of keywords) {
            if (joinedCount >= MAX_JOINS) {
                console.log('🛑 Daily join limit reached. Stopping discovery.');
                break;
            }

            const searchUrl = `https://www.facebook.com/groups/search/groups/?q=${encodeURIComponent(keyword)}`;
            console.log(`   🔎 Searching: ${keyword}`);
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            // Random human delay
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

            // Scroll a bit to look human
            await page.evaluate(() => window.scrollBy(0, 500));
            await new Promise(r => setTimeout(r, 1000));

            // Extract join buttons (Public Groups only usually have simple logic, Private often have questions)
            // Look for "Join group" aria-label
            const joinButtons = await page.$$('div[aria-label="Join group"]');

            if (joinButtons.length > 0) {
                console.log(`      Found ${joinButtons.length} potential groups.`);

                // Only try the first valid one we find
                for (const btn of joinButtons) {
                    if (joinedCount >= MAX_JOINS) break;

                    try {
                        const groupName = await page.evaluate(el => {
                            const parent = el.closest('div[role="article"]');
                            return parent ? parent.innerText.split('\n')[0] : 'Unknown Group';
                        }, btn);

                        // Check if we've already joined/tried this session (simple local check)
                        // In reality, FB UI changes to "Request Sent" or "Joined"

                        console.log(`      🚀 Clicking Join for: ${groupName}`);
                        await btn.click();
                        await new Promise(r => setTimeout(r, 4000 + Math.random() * 2000)); // Wait for modal

                        // Check for Question Modal
                        const hasQuestions = await page.evaluate(() => {
                            return document.body.innerText.includes('Answer questions') ||
                                document.body.innerText.includes('Admin approval');
                        });

                        if (hasQuestions) {
                            console.log('      📝 Questions detected. Closing/Skipping to avoid bot flags.');
                            // Try to press Escape or find Close button
                            await page.keyboard.press('Escape');
                            await new Promise(r => setTimeout(r, 1000));
                        } else {
                            console.log('      ✅ Join request sent (likely auto-approve or simple).');
                            joinedCount++;
                        }

                    } catch (e) {
                        console.log(`      ⚠️ Failed to interact with button: ${e.message}`);
                    }
                }
            }
        }
    } catch (e) {
        console.error('   ⚠️ Discovery failed:', e.message);
    } finally {
        await page.close();
    }
}

async function runScraper() {
    console.log('🚀 Starting Social Growth Agent...');

    // 1. Launch Browser
    const { launchBrowser } = require('./browser_launcher');
    const browser = await launchBrowser();

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
            // NEW STRATEGY: Get top-level feed items
            const feedItems = document.querySelectorAll('div[role="feed"] > div, div[role="article"]');

            return Array.from(feedItems).map(el => {
                const text = el.innerText;
                // Attempt to find timestamp link (deep link to post)
                const linkEl = el.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/groups/"]'); // Fallback to any group link
                let postUrl = window.location.href;
                if (linkEl) {
                    // Clean URL (remove tracking params)
                    const urlObj = new URL(linkEl.href);
                    postUrl = urlObj.origin + urlObj.pathname;
                }

                // Simple hash for ID
                let hash = 0;
                for (let i = 0; i < text.length; i++) {
                    hash = ((hash << 5) - hash) + text.charCodeAt(i);
                    hash |= 0;
                }
                return {
                    external_id: 'fb_' + Math.abs(hash),
                    raw_content: text,
                    url: postUrl
                };
            }).filter(p => p.raw_content && p.raw_content.length > 50);
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
                const isHighConfidence = analysis.confidence > 0.85;
                const status = isHighConfidence ? 'approved' : 'new';

                const { data: lead } = await supabase.from('leads').insert({
                    source_post_id: insertedPost.id,
                    name: analysis.name || 'Unknown Candidate',
                    role: analysis.role,
                    skills: analysis.skills,
                    status: status,
                    primary_skill: analysis.skills?.[0] || 'Sim Racing',
                    // Store Rich Data in Contact Info JSONB (Fallback Schema)
                    contact_info: {
                        username: username,
                        bio: richData.bio,
                        avatar_url: richData.avatar_url,
                        location: richData.location,
                        profile_link: richData.profileLink || post.url,
                        email: null,
                        needs_resume: analysis.needs_resume,
                        suggested_outreach: CONFIG.outreach_templates.resume_builder.replace('{name}', analysis.name || 'there'),
                        confidence: analysis.confidence
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

                    if (isHighConfidence) {
                        console.log(`   🔥 HIGH CONFIDENCE (${analysis.confidence}): Auto-Approved for messaging.`);
                    } else {
                        console.log(`   ✋ Needs Review (${analysis.confidence}): Saved as 'new'.`);
                    }

                    if (lead.contact_info && lead.contact_info.suggested_outreach) {
                        console.log(`   📝 Outreach: "${lead.contact_info.suggested_outreach}"`);
                    }
                }

            } else if ((analysis.type === 'tech_support' || analysis.type === 'custom_tool' || analysis.type === 'race_shop' || analysis.type === 'collector') && analysis.confidence > 0.6) {
                // Handle Tech Support / Custom Tool / Race Shop / Collector Leads
                // Generate Public Username
                const baseUsername = (analysis.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
                const username = `${baseUsername}-${Math.floor(Math.random() * 1000)}`;

                let outreachTemplate = "";
                if (analysis.type === 'tech_support') outreachTemplate = CONFIG.outreach_templates.tech_support;
                if (analysis.type === 'custom_tool') outreachTemplate = CONFIG.outreach_templates.custom_tool;
                if (analysis.type === 'race_shop') outreachTemplate = CONFIG.outreach_templates.race_shop;
                if (analysis.type === 'collector') outreachTemplate = CONFIG.outreach_templates.collector;

                const outreachMsg = outreachTemplate
                    .replace('{name}', analysis.name || 'there')
                    .replace('{topic}', analysis.topic || 'your project');

                const { data: lead } = await supabase.from('leads').insert({
                    source_post_id: insertedPost.id,
                    name: analysis.name || 'Unknown User',
                    role: analysis.type,
                    skills: analysis.skills,
                    status: 'new',
                    primary_skill: analysis.topic || 'General',
                    contact_info: {
                        username: username,
                        profile_link: post.url,
                        suggested_outreach: outreachMsg,
                        confidence: analysis.confidence
                    }
                }).select().single();

                if (lead) {
                    console.log(`🛠️  New ${analysis.type} Lead: ${lead.name}`);
                    console.log(`   📝 Outreach: "${outreachMsg}"`);
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

        // Run other agents sharing the same browser context
        if (typeof discoverGroups !== 'undefined') await discoverGroups(browser);
        if (typeof processApprovedLeads !== 'undefined') await processApprovedLeads(browser);

    }
}

// --- AUTO-RESPONDER AGENT ---
async function processApprovedLeads(browser) {
    console.log('📨 logical-responder: Checking for approved leads to message...');

    // 1. Get Approved Leads
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'approved')
        .limit(5);

    if (!leads || leads.length === 0) return;

    const page = await browser.newPage();

    for (const lead of leads) {
        console.log(`   🚀 Sending message to ${lead.name}...`);
        try {
            const targetUrl = lead.contact_info.profile_link; // Should be the deep link now
            if (!targetUrl || !targetUrl.includes('facebook.com')) {
                console.log(`      Skipping invalid link: ${targetUrl}`);
                continue;
            }

            await page.goto(targetUrl, { waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));

            // Focus on Comment Box (Generic attempt for FB)
            // This is brittle. Strategy: press 'c' or find aria-label="Write a comment"
            // await page.keyboard.press('c'); // Sometimes works to focus comment

            const commentBox = await page.$('div[aria-label="Write a comment"], div[aria-label="Comment as ' + (process.env.FB_NAME || "me") + '"]');

            if (commentBox) {
                await commentBox.click();
                await new Promise(r => setTimeout(r, 1000));

                // Type Message
                const message = lead.contact_info.suggested_outreach;
                await page.keyboard.type(message, { delay: 50 });
                await new Promise(r => setTimeout(r, 1000));

                // Send 
                console.log(`      ✍️  Typed: "${message}"`);
                await page.keyboard.press('Enter');
                // await new Promise(r => setTimeout(r, 3000)); // Wait for post

                // Mark as Sent
                await supabase.from('leads').update({ status: 'sent' }).eq('id', lead.id);
                console.log(`      ✅ Message sent!`);
            } else {
                console.log('      ❌ Could not find comment box.');
                // Mark as failed so we don't retry forever
                await supabase.from('leads').update({ status: 'failed_no_box' }).eq('id', lead.id);
            }

        } catch (e) {
            console.error(`      ⚠️ Sending failed for ${lead.name}:`, e.message);
        }
    }
    await page.close();
}

runScraper();
