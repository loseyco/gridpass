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
