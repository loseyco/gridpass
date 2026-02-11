const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { launchBrowser } = require('./browser_launcher');

puppeteer.use(StealthPlugin());

const CONFIG = require('./growth_config.json');

const LINKEDIN_BASE = 'https://www.linkedin.com';
const SEARCH_QUERIES = CONFIG.linkedin_queries || [
    'Sim Racing Team Manager',
    'Esports Team Owner',
    'Sim Racing Driver',
    'Motorsport Marketing'
];
const MESSAGE_TEMPLATE = CONFIG.outreach_templates.resume_builder;
const MAX_ACTIONS_PER_RUN = 5; // Safety limit
const DELAY_MIN = 3000;
const DELAY_MAX = 7000;

// --- SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// --- HELPERS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = () => sleep(Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1) + DELAY_MIN));

async function checkLogin(page) {
    console.log('🔒 Checking LinkedIn Login...');
    await page.goto(LINKEDIN_BASE + '/feed/', { waitUntil: 'domcontentloaded' });
    
    if (page.url().includes('login') || page.url().includes('signup')) {
        console.log('⚠️ Not logged in. Please log in manually in the browser window.');
        console.log('Waiting 60s...');
        await sleep(60000);
    } else {
        console.log('✅ Logged in.');
    }
}

async function searchAndConnect(page, query) {
    console.log(`🔍 Searching for: "${query}"`);
    const searchUrl = `${LINKEDIN_BASE}/search/results/people/?keywords=${encodeURIComponent(query)}&origin=SWITCH_SEARCH_VERTICAL`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await randomDelay();

    // Scroll to load results
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(1000);

    // Get Result List Items
    // Selectors change, but usually 'li.reusable-search__result-container'
    const results = await page.$$('li.reusable-search__result-container');
    console.log(`   Found ${results.length} results.`);

    let actions = 0;

    for (const res of results) {
        if (actions >= 2) break; // Limit per query

        try {
            // Extract Name and Link
            const nameEl = await res.$('.entity-result__title-text a');
            if (!nameEl) continue;

            const name = await page.evaluate(el => el.innerText.split('\n')[0], nameEl);
            const link = await page.evaluate(el => el.href, nameEl);
            const title = await page.evaluate(el => {
                const t = el.closest('li').querySelector('.entity-result__primary-subtitle');
                return t ? t.innerText : '';
            }, nameEl);

            if (!link || !name) continue;

            // Check if already processed
            const { data: existing } = await supabase
                .from('leads')
                .select('id')
                .eq('source_link', link)
                .single();

            if (existing) {
                console.log(`   Skipping existing: ${name}`);
                continue;
            }

            console.log(`   👉 Processing: ${name} (${title})`);

            // Check for Connect Button
            const connectBtn = await res.$('button[aria-label^="Invite"][aria-label$="to connect"]');
            
            // NOTE: We are NOT clicking connect automatically yet to be safe.
            // Just saving the lead for now.
            // If user wants auto-connect, we can enable it later.
            
            const leadData = {
                name: name,
                role: title,
                source_link: link,
                status: 'new',
                source: 'linkedin',
                contact_info: {
                    search_query: query,
                    can_connect: !!connectBtn
                },
                notes: 'Found via LinkedIn Scraper. Needs Resume Builder pitch.'
            };

            const { error } = await supabase.from('leads').insert(leadData);
            
            if (!error) {
                console.log(`     💾 Saved lead: ${name}`);
                actions++;
            } else {
                console.error(`     ❌ Error saving lead: ${error.message}`);
            }

        } catch (e) {
            console.error('     ⚠️ Error processing result:', e.message);
        }
    }
}

async function run() {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    
    try {
        await checkLogin(page);

        for (const query of SEARCH_QUERIES) {
            await searchAndConnect(page, query);
            await randomDelay();
        }

        console.log('✅ LinkedIn Cycle Complete.');
    } catch (e) {
        console.error('❌ Script failed:', e);
    } finally {
        console.log('Leaving browser open.');
    }
}

run();
