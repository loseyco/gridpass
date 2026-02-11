const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// --- CONFIG ---
const TARGET_NAME = "Arvid Lindblad";
const USER_DATA_DIR = path.join(__dirname, '..', 'temp_chrome_profile_test');

// --- SUPABASE SETUP ---
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
            const link = document.querySelector('a[href*="driverdb.com"], a[href*="wikipedia.org"], a[href*="instagram.com"]');
            return link ? link.href : null;
        });


        // 2. Search Google Images for Photo
        const imgQuery = encodeURIComponent(`${name} racing driver`);
        await page.goto(`https://www.google.com/search?tbm=isch&q=${imgQuery}`, { waitUntil: 'domcontentloaded' });

        // Wait a moment for images to load
        await new Promise(r => setTimeout(r, 1000));

        // Click the first image to get higher res (sometimes needed)
        // Or just grab the thumbnail src for speed/simplicity
        avatar_url = await page.evaluate(() => {
            const img = document.querySelector('img[src^="http"]'); // Get first loaded image
            return img ? img.src : null;
        });

    } catch (err) {
        console.error(`⚠️ Research failed for ${name}:`, err.message);
    } finally {
        await page.close();
    }

    return { bio, avatar_url, location, profileLink };
}

async function run() {
    console.log('🧪 Starting Isolated Research Test...');

    const { launchBrowser } = require('./browser_launcher');
    const browser = await launchBrowser();

    const richData = await researchCandidate(TARGET_NAME, browser);
    console.log('🎉 Research Complete:', richData);

    // Generate Public Username
    const baseUsername = TARGET_NAME.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const username = `${baseUsername}-${Math.floor(Math.random() * 1000)}`;

    // Save to DB
    const { data: lead } = await supabase.from('leads').insert({
        source_post_id: null, // Manually added
        name: TARGET_NAME,
        role: 'Racing Driver',
        skills: ['Formula 3', 'Red Bull Junior', 'Karting', 'Sim Racing', 'Precision Driving', 'Team Leadership'],
        status: 'new',
        primary_skill: 'Formula 3',
        contact_info: {
            username: username,
            bio: richData.bio,
            avatar_url: richData.avatar_url,
            location: richData.location || "London, UK",
            profile_link: richData.profileLink || "https://www.redbull.com/int-en/juniorteam/drivers/arvid-lindblad",
            email: null,
            // Richer Data for "Live Resume" feel
            career_history: [
                {
                    id: '1',
                    title: 'Formula 3 Driver',
                    organization: 'PREMA Racing',
                    start_date: '2024',
                    is_current: true,
                    type: 'contract',
                    description: 'Competed in the FIA Formula 3 Championship as part of the Red Bull Junior Team.'
                },
                {
                    id: '2',
                    title: 'Karting Champion',
                    organization: 'WSK Euro Series',
                    start_date: '2021',
                    end_date: '2022',
                    is_current: false,
                    type: 'event',
                    description: 'Winner of the WSK Euro Series in OK category.'
                }
            ],
            driver_info: {
                iracing_ir: '4200',
                iracing_sr: 'A 4.99',
                competitions: 'Formula 3, Formula 4, Karting'
            },
            social_links: [
                "https://www.instagram.com/arvidlindblad",
                "https://twitter.com/arvidlindblad"
            ]
        }
    }).select().single();

    if (lead) {
        // Auto-Generate Claim Token (for demo)
        const tokenString = 'claim_arvid_' + Math.random().toString(36).substring(7);
        await supabase.from('claim_tokens').insert({
            entity_type: 'lead',
            entity_id: lead.id,
            token: tokenString
        });
        console.log(`✨ Generated Claim Link for ${lead.name}: http://localhost:3000/claim/${tokenString}`);
        console.log(`🌍 Public Profile (Shadow): http://localhost:3000/u/${lead.contact_info.username}`);
    }

    // CLOSE BROWSER if requested
    // This helps with the "too many tabs" issue
    await browser.close();

    // Don't close browser immediately so user can see result
    // await browser.close();
}

run();
