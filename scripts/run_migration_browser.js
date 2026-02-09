const puppeteer = require('puppeteer');

// SQL to run
const SQL_MIGRATION = `
-- GROWTH ENGINE TABLES
create table if not exists public.scraped_listings (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  origin_author_name text,
  origin_source text,
  origin_url text,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.scraped_candidates (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  skills text,
  experience text,
  origin_source text,
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.scraped_listings enable row level security;
create policy "Public read" on public.scraped_listings for select using (true);
create policy "Service write" on public.scraped_listings for all using (true); -- Broad for dev

alter table public.scraped_candidates enable row level security;
create policy "Service write cand" on public.scraped_candidates for all using (true);
`;

(async () => {
  try {
    console.log('📡 Connecting to Edge to run SQL...');
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('supabase.com'));
    
    if (!page) {
        console.log('Opening new Supabase tab...');
        page = await browser.newPage();
        await page.goto('https://supabase.com/dashboard/project/bwpmqsdykumtfusflhri/sql/new', { waitUntil: 'networkidle2' });
    } else {
        await page.bringToFront();
        if (!page.url().includes('/sql')) {
            await page.goto('https://supabase.com/dashboard/project/bwpmqsdykumtfusflhri/sql/new', { waitUntil: 'networkidle2' });
        }
    }

    console.log('💻 Pasting SQL...');
    
    // Wait for the Monaco editor or text area
    // This selector is tricky, Supabase uses Monaco. 
    // Strategy: Click in the middle, Select All, Type.
    
    await new Promise(r => setTimeout(r, 5000)); // Wait for loading
    
    // Simulate user typing (robust)
    await page.keyboard.type(SQL_MIGRATION);
    
    console.log('▶️ Running Query (Manual click required maybe)...');
    
    // Try to find the "Run" button. It usually says "Run" or has a play icon.
    // We'll rely on you clicking run if I can't find it, but I'll try.
    // Selector for the "Run" button in Supabase SQL editor is constantly changing.
    
    console.log('⚠️ PLEASE CLICK "RUN" IN THE BROWSER NOW!');
    
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
