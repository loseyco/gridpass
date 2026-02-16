-- Create table for managing news sources (RSS feeds)
create table if not exists os_news_sources (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    url text not null unique,
    type text not null check (type in ('rss', 'scrape')),
    enabled boolean default true,
    last_scraped_at timestamptz,
    created_at timestamptz default now()
);

-- Enable RLS
alter table os_news_sources enable row level security;

-- Policies (Allow all for now, restrict in prod if needed, strictly purely internal tool)
create policy "Allow all access to os_news_sources" on os_news_sources for all using (true);

-- Seed with initial data
insert into os_news_sources (name, url, type) values
    ('Racer.com', 'https://www.racer.com/feed', 'rss'),
    ('Autosport (All)', 'https://www.autosport.com/rss/feed/all', 'rss'),
    ('Motorsport.com (All)', 'https://www.motorsport.com/rss/all/news/', 'rss')
on conflict (url) do nothing;
