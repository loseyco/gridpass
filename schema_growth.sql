-- GROWTH ENGINE SCHEMA
-- Purpose: Store scraped gigs and shadow profiles for recruitment automation.

-- 1. Listings (Jobs, Gigs, For Sale)
-- Supports both native GridPass listings and scraped "Shadow" listings.
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null, -- Null if shadow/scraped
  title text not null,
  description text,
  type text check (type in ('job', 'gig', 'sale', 'service', 'transport')) not null,
  location text,
  price_range text, -- e.g. "$20/hr" or "$500 flat"
  
  -- Origin Data (for scraped content)
  origin_source text, -- 'facebook', 'luxecorsa', etc.
  origin_url text,
  origin_author_name text,
  origin_posted_at timestamptz,
  
  status text default 'active' check (status in ('active', 'closed', 'claimed', 'shadow')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Shadow Profiles (Potential Users)
-- People we found looking for work. We create a placeholder they can claim.
create table if not exists public.shadow_profiles (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  
  -- Skills extracted from their post
  skills jsonb default '[]'::jsonb, -- ['composites', 'driving', 'welding']
  experience_summary text,
  
  -- Where we found them
  origin_source text,
  origin_url text,
  origin_profile_url text,
  
  -- Claim Logic
  claim_token uuid default gen_random_uuid(), -- The magic link token
  claimed_by_user_id uuid references public.profiles(id) on delete set null,
  status text default 'unclaimed' check (status in ('unclaimed', 'contacted', 'claimed')),
  
  created_at timestamptz default now()
);

-- 3. RLS Policies (Security)
alter table public.listings enable row level security;
alter table public.shadow_profiles enable row level security;

-- Public Read for Listings (So we can share links)
create policy "Listings are viewable by everyone"
  on public.listings for select
  using ( true );

-- Service Role / Admin write access (You need this to ingest)
-- (Assuming PJ is Super Admin or using Service Key)

-- 4. Notifications (Alerts & Nudges)
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  message text,
  type text default 'info', -- 'alert', 'success', 'nudge', 'warning'
  link text, -- Optional deep link
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS for Notifications
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );

-- Admins/Service Role can insert notifications
