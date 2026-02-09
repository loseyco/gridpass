const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'facebook_feed.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'insert_jobs.sql');

function extractJobDetails(text) {
    let type = 'job';
    if (text.toLowerCase().includes('looking for work') || text.toLowerCase().includes('seeking')) type = 'candidate';
    
    // Escape single quotes for SQL
    const safeText = text.replace(/'/g, "''");
    
    const titleMatch = text.match(/^(.+?)\n/);
    const title = titleMatch ? titleMatch[1].substring(0, 100).replace(/'/g, "''") : 'New Opportunity';
    
    const authorMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    const author = authorMatch ? authorMatch[1].replace(/'/g, "''") : 'Unknown User';

    return { type, title, safeText, author };
}

(async () => {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const posts = JSON.parse(rawData);
    
    let sql = `
-- Create Tables (Idempotent)
create table if not exists public.scraped_listings (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  origin_author_name text,
  origin_source text default 'facebook',
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.scraped_candidates (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  experience_summary text,
  origin_source text default 'facebook',
  status text default 'unclaimed',
  created_at timestamptz default now()
);

-- Inserts
`;

    for (const post of posts) {
        const details = extractJobDetails(post.text);
        if (details.type === 'candidate') {
            sql += `INSERT INTO public.scraped_candidates (full_name, experience_summary) VALUES ('${details.author}', '${details.safeText}');\n`;
        } else {
            sql += `INSERT INTO public.scraped_listings (title, description, origin_author_name) VALUES ('${details.title}', '${details.safeText}', '${details.author}');\n`;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`✅ Generated SQL file at: ${OUTPUT_FILE}`);
})();
