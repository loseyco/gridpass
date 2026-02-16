-- Create OS Stewards Incidents Table
create table if not exists public.os_stewards_incidents (
    id uuid not null default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null, -- Nullable for scraped content or deleted users
    title text not null,
    description text,
    video_url text not null,
    sim_title text, -- iRacing, ACC, F1 24, etc.
    reddit_post_id text unique, -- For scraped content deduplication
    created_at timestamptz not null default now(),
    
    constraint os_stewards_incidents_pkey primary key (id)
);

-- Enable RLS
alter table public.os_stewards_incidents enable row level security;

-- Policies for Incidents
create policy "Incidents are viewable by everyone" 
    on public.os_stewards_incidents for select 
    using (true);

create policy "Authenticated users can insert incidents" 
    on public.os_stewards_incidents for insert 
    with check (auth.role() = 'authenticated');

create policy "Users can update their own incidents" 
    on public.os_stewards_incidents for update 
    using (auth.uid() = user_id);

-- Create OS Stewards Votes Table
create table if not exists public.os_stewards_votes (
    id uuid not null default gen_random_uuid(),
    incident_id uuid not null references public.os_stewards_incidents(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null, -- Nullable for anonymous votes
    ip_address text, -- For anonymous rate limiting
    fingerprint text, -- Browser fingerprint for better anon tracking
    vote_type text not null check (vote_type in ('driver_a', 'driver_b', 'racing_incident')),
    created_at timestamptz not null default now(),

    constraint os_stewards_votes_pkey primary key (id),
    -- Prevent multiple votes from same logged-in user
    constraint unique_user_vote unique (incident_id, user_id),
    -- Prevent multiple votes from same IP for anonymous (soft check, enforce in app logic primarily, but good to have)
    -- We won't strictly enforce unique IP at DB level to allow shared households (NAT), 
    -- but we will index it for quick lookups.
    constraint unique_vote_record unique (incident_id, user_id, ip_address, fingerprint)
);

create index idx_stewards_votes_incident on public.os_stewards_votes(incident_id);
create index idx_stewards_votes_ip on public.os_stewards_votes(incident_id, ip_address) where user_id is null;

-- Enable RLS
alter table public.os_stewards_votes enable row level security;

-- Policies for Votes
create policy "Votes are viewable by everyone" 
    on public.os_stewards_votes for select 
    using (true);

create policy "Everyone can insert votes" 
    on public.os_stewards_votes for insert 
    with check (true); -- Logic handled in API/Middleware to prevent spam

-- Create OS Stewards Comments Table
create table if not exists public.os_stewards_comments (
    id uuid not null default gen_random_uuid(),
    incident_id uuid not null references public.os_stewards_incidents(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now(),

    constraint os_stewards_comments_pkey primary key (id)
);

-- Enable RLS
alter table public.os_stewards_comments enable row level security;

-- Policies for Comments
create policy "Comments are viewable by everyone" 
    on public.os_stewards_comments for select 
    using (true);

create policy "Authenticated users can insert comments" 
    on public.os_stewards_comments for insert 
    with check (auth.role() = 'authenticated');

create policy "Users can update their own comments" 
    on public.os_stewards_comments for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own comments" 
    on public.os_stewards_comments for delete 
    using (auth.uid() = user_id);
