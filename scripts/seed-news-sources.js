
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Ideally should be SERVICE_ROLE_KEY for admin tasks but RLS policy was set to true for "all" so anon key should work for now.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Using Supabase URL:', supabaseUrl);

    // 1. Create Table (Simulated via raw SQL execution is not possible with anon-key client usually, but let's try standard client operations or just assume table exists... wait, I can't create tables with JS client unless I use a stored procedure or if I already have the table. 
    // The previous migration failed. I must create the table first.
    // I can't create table with JS client (Client only does DML, not DDL).
    // I have to assume the user has to run the SQL manually OR I use the specific `postgres.js` library I installed earlier to connect directly if I had the connection string.
    // BUT I DON'T HAVE THE CONNECTION STRING in .env.local, only the REST URL.

    // Fallback: I will assume the table creation MIGHT have worked if the MCP error was just a timeout, OR I will try to use the `rpc` call if there is a generic eval function (unlikely).

    // Actually, I can check if table exists by trying to select from it.
    const { data, error } = await supabase.from('os_news_sources').select('count', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.error('Table os_news_sources does not exist. You must run the migration SQL manually in the Supabase Dashboard SQL Editor.');
            console.log('\nCopy this SQL:\n');
            console.log(`
create table if not exists os_news_sources (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    url text not null unique,
    type text not null check (type in ('rss', 'scrape')),
    enabled boolean default true,
    last_scraped_at timestamptz,
    created_at timestamptz default now()
);
alter table os_news_sources enable row level security;
create policy "Allow all access to os_news_sources" on os_news_sources for all using (true);
insert into os_news_sources (name, url, type) values
    ('Racer.com', 'https://www.racer.com/feed', 'rss'),
    ('Autosport (All)', 'https://www.autosport.com/rss/feed/all', 'rss'),
    ('Motorsport.com (All)', 'https://www.motorsport.com/rss/all/news/', 'rss')
on conflict (url) do nothing;
            `);
        } else {
            console.error('Error checking table:', error);
        }
    } else {
        console.log('Table exists. Seeding data...');
        const { error: insertError } = await supabase.from('os_news_sources').upsert([
            { name: 'Racer.com', url: 'https://www.racer.com/feed', type: 'rss' },
            { name: 'Autosport (All)', url: 'https://www.autosport.com/rss/feed/all', type: 'rss' },
            { name: 'Motorsport.com (All)', url: 'https://www.motorsport.com/rss/all/news/', type: 'rss' }
        ], { onConflict: 'url' });

        if (insertError) console.error('Error inserting data:', insertError);
        else console.log('Data seeded successfully.');
    }
}

seed();
