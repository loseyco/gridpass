const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// CONFIG
const BOT_PROFILE = path.join(__dirname, '..', '..', 'gridpass_bot_profile');
const GROUP_URL = 'https://www.facebook.com/groups/373733806854468';
const PAGE_URL = 'https://www.facebook.com/gridpassapp';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  console.log('🤖 Community Manager Starting...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep visible for debugging first run
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: BOT_PROFILE,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // 1. SCRAPE
  console.log('🕷️ Scraping Group...');
  await page.goto(GROUP_URL, { waitUntil: 'networkidle2' });
  
  // Quick scroll
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 2000));
  }

  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[role="feed"] > div'))
      .map(el => el.innerText)
      .filter(t => t && t.length > 50)
      .slice(0, 5); // Just top 5 for now
  });

  console.log(`✅ Found ${posts.length} posts.`);

  // 2. PROCESS & POST
  for (const text of posts) {
      // Basic check if it's a job
      if (!text.toLowerCase().includes('hiring') && !text.toLowerCase().includes('looking for')) continue;

      // Extract details (simplified)
      const title = text.split('\n')[0].substring(0, 50);
      
      // Check if exists
      const { data: existing } = await supabase.from('scraped_listings').select('id').eq('description', text).single();
      
      if (!existing) {
          console.log(`🆕 New Gig Found: ${title}`);
          
          // Save to DB
          const { data: inserted, error } = await supabase.from('scraped_listings').insert({
              title: title,
              description: text,
              origin_source: 'facebook_group',
              status: 'active'
          }).select().single();

          if (inserted) {
              const link = `https://gridpass.app/jobs/${inserted.id}`; // Fake link for now until route exists
              
              // Post to GridPass Page
              console.log('📢 Posting to Page...');
              await page.goto(PAGE_URL, { waitUntil: 'networkidle2' });
              
              // Click "Write something..." (Selector is brittle, trying generic text match)
              // Note: Posting via Puppeteer is hard because of dynamic classes.
              // We'll log it for now.
              console.log(`TODO: Auto-post this link: ${link}`);
          }
      }
  }

  console.log('💤 Done.');
  await browser.close();
})();
