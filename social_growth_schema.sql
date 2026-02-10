-- Social Growth & Lead Gen Schema

-- 1. Scraped Posts (Raw Data Lake)
create table if not exists public.scraped_posts (
  id uuid default gen_random_uuid() primary key,
  source text not null check (source in ('facebook', 'discord', 'twitter', 'linkedin')),
  external_id text, -- Post ID from source
  url text,
  author_name text,
  raw_content text,
  metadata jsonb default '{}'::jsonb,
  processed boolean default false,
  created_at timestamptz default now()
);

-- 2. Leads (Unclaimed Profiles / Candidates)
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text,
  role text, -- e.g. 'Driver', 'Mechanic'
  primary_skill text, -- e.g. 'GT3', 'Setup Work'
  source_post_id uuid references public.scraped_posts(id),
  source_link text,
  contact_info jsonb default '{}'::jsonb, -- Store extracted email/discord if available
  skills text[],
  status text default 'new' check (status in ('new', 'contacted', 'claimed', 'archived')),
  claimed_by_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 3. Jobs (Unclaimed / Claimed Job Postings)
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  team_name text,
  role text,
  description text,
  requirements text[],
  source_post_id uuid references public.scraped_posts(id),
  source_link text,
  status text default 'open' check (status in ('open', 'filled', 'claimed', 'archived')),
  claimed_by_team_id uuid, -- Link to team ID if we have teams table, otherwise user_id
  created_at timestamptz default now()
);

-- 4. Claim Tokens (The "Golden Ticket")
create table if not exists public.claim_tokens (
  id uuid default gen_random_uuid() primary key,
  token text unique default encode(gen_random_bytes(16), 'hex'),
  entity_type text check (entity_type in ('lead', 'job')),
  entity_id uuid not null, -- References leads.id or jobs.id
  email text, -- Optional: if we sent the token to a specific email
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  redeemed_at timestamptz
);

-- RLS Policies
-- Enable RLS
alter table public.scraped_posts enable row level security;
alter table public.leads enable row level security;
alter table public.jobs enable row level security;
alter table public.claim_tokens enable row level security;

-- Policies (Open for now to facilitate agent access, lock down later)
create policy "Service Role can manage all" on public.scraped_posts for all using (true);
create policy "Service Role can manage leads" on public.leads for all using (true);
create policy "Service Role can manage jobs" on public.jobs for all using (true);
create policy "Service Role can manage tokens" on public.claim_tokens for all using (true);

-- Public Read for Jobs (Job Board)
create policy "Public can view open jobs" on public.jobs for select using (status = 'open');

-- Indexes
create index if not exists idx_scraped_posts_external_id on public.scraped_posts(external_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_claim_tokens_token on public.claim_tokens(token);

-- 5. Scraped Listings (Staging area for Jobs/Classifieds)
create table if not exists public.scraped_listings (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  price numeric,
  origin_source text default 'FACEBOOK',
  origin_author_name text,
  origin_url text,
  raw_data jsonb default '{}'::jsonb,
  type text check (type in ('job', 'classified', 'event', 'other')),
  status text default 'new' check (status in ('new', 'processed', 'discarded')),
  created_at timestamptz default now()
);

-- 6. Classifieds (Marketplace)
create table if not exists public.classifieds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  price numeric,
  category text, -- 'parts', 'cars', 'hardware'
  status text default 'active',
  images text[],
  contact_info jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Organizations (Businesses)
create table if not exists public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text, -- 'shop', 'team', 'service', 'track'
  description text,
  location text,
  website text,
  status text default 'active',
  lead_status text default 'prospect',
  contact_email text,
  logo_url text,
  claimed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz default now()
);

-- RLS for new tables
alter table public.scraped_listings enable row level security;
alter table public.classifieds enable row level security;
alter table public.organizations enable row level security;

create policy "Service Role can manage scraped_listings" on public.scraped_listings for all using (true);
create policy "Service Role can manage classifieds" on public.classifieds for all using (true);
create policy "Service Role can manage organizations" on public.organizations for all using (true);
create policy "Public can view classifieds" on public.classifieds for select using (status = 'active');
create policy "Public can view organizations" on public.organizations for select using (status = 'active');
