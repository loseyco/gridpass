const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MSR_URL = 'https://www.motorsportreg.com/calendar/?country=US&radius=60&lat=41.8781&lng=-87.6298&loc=Chicago%2C+IL'; // Chicago + 60 miles

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  console.log('🏁 Event Scraper Starting (MotorsportReg - Chicago)...');
  
  // Use existing debug browser if available (fastest), else launch temp
  let browser;
  try {
      browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
      console.log('✅ Connected to existing browser.');
  } catch (e) {
      console.log('🚀 Launching new browser...');
      browser = await puppeteer.launch({ headless: true });
  }

  const page = await browser.newPage();
  await page.goto(MSR_URL, { waitUntil: 'domcontentloaded' });

  // Scrape MSR List
  const events = await page.evaluate(() => {
      const items = document.querySelectorAll('.event-item');
      return Array.from(items).map(item => {
          const title = item.querySelector('.title a')?.innerText.trim();
          const link = item.querySelector('.title a')?.href;
          const date = item.querySelector('.date')?.innerText.trim(); // "Feb 14"
          const location = item.querySelector('.venue')?.innerText.trim();
          const host = item.querySelector('.host')?.innerText.trim();
          
          return { title, link, date, location, host };
      }).filter(e => e.title);
  });

  console.log(`✅ Found ${events.length} events near Chicago.`);

  // Insert into DB
  for (const event of events) {
      // Basic duplicate check
      const { data: existing } = await supabase.from('social_events')
        .select('id')
        .eq('title', event.title)
        .single();
      
      if (!existing) {
          // Parse date (rough heuristic for "Feb 14")
          const currentYear = new Date().getFullYear();
          const dateStr = `${event.date} ${currentYear}`; 
          
          await supabase.from('social_events').insert({
              title: event.title,
              description: `Hosted by ${event.host}. Source: MotorsportReg`,
              location: event.location,
              start_time: new Date(dateStr).toISOString(), // rough parsing
              end_time: new Date(dateStr).toISOString(),
              external_link: event.link,
              type: 'track_day',
              status: 'published',
              created_by: '00000000-0000-0000-0000-000000000000' // System user UUID
          });
          console.log(`➕ Added: ${event.title}`);
      }
  }

  console.log('💤 Done.');
  if (!browser.isConnected()) await browser.close();
  else await page.close();
})();
