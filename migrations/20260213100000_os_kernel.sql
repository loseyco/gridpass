-- GridPass OS Kernel Migration
-- Created: 2026-02-13
-- Description: Establishes the core "Operating System" tables for the new schema-driven architecture.

-- 1. os_user_profiles: Core Identity
-- This table is the "Single Source of Truth" for user identity in the OS.
create table if not exists public.os_user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  first_name text,
  last_name text,
  middle_name text,
  nickname text,
  headline text,
  bio text,
  date_of_birth date,
  hometown text,
  current_location text,
  citizenship text,
  avatar_url text,
  cover_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.os_user_profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on public.os_user_profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.os_user_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.os_user_profiles for insert
  with check ( auth.uid() = id );


-- 2. os_user_work_history: Experience Log
create table if not exists public.os_user_work_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.os_user_profiles(id) on delete cascade not null,
  team_name text not null,
  series text, -- e.g. "IndyCar", "IMSA"
  role text not null,
  start_date date,
  end_date date,
  is_current boolean default false,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_user_work_history enable row level security;

create policy "Work history viewable by everyone"
  on public.os_user_work_history for select
  using ( true );

create policy "Users can manage own work history"
  on public.os_user_work_history for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 3. os_user_logistics: Deployment Vault
create table if not exists public.os_user_logistics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.os_user_profiles(id) on delete cascade not null,
  tsa_precheck text,
  passport_status text, -- "Active", "Expired"
  shirt_size text,
  travel_rewards jsonb default '{}'::jsonb,
  nearest_airport text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_user_logistics enable row level security;

-- Logistics are private by default, or viewable by specific orgs later.
create policy "Users can manage own logistics"
  on public.os_user_logistics for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 4. os_user_skills: Technical Capability Registry
create table if not exists public.os_user_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.os_user_profiles(id) on delete cascade not null,
  skill text not null,
  category text,
  proficiency integer check (proficiency between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_user_skills enable row level security;

create policy "Skills viewable by everyone"
  on public.os_user_skills for select
  using ( true );

create policy "Users can manage own skills"
  on public.os_user_skills for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 5. os_user_certs: Licensing and Certifications
create table if not exists public.os_user_certs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.os_user_profiles(id) on delete cascade not null,
  authority text not null, -- e.g. "SCCA", "FIA"
  name text not null,
  license_number text,
  expiration_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_user_certs enable row level security;

create policy "Certs viewable by everyone"
  on public.os_user_certs for select
  using ( true );

create policy "Users can manage own certs"
  on public.os_user_certs for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 6. os_user_memberships: Vouch System
create table if not exists public.os_user_memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.os_user_profiles(id) on delete cascade not null,
  group_id uuid, -- Can reference an os_teams table later
  role text,
  status text default 'pending', -- "Pending", "Active"
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_user_memberships enable row level security;

create policy "Memberships viewable by everyone"
  on public.os_user_memberships for select
  using ( true );

create policy "Users can manage own memberships"
  on public.os_user_memberships for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- 7. os_apps: The App Store Registry
create table if not exists public.os_apps (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  schema jsonb not null default '{}'::jsonb,
  version text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.os_apps enable row level security;

create policy "Apps are viewable by everyone"
  on public.os_apps for select
  using ( true );

-- Only admins/service_role usually update apps, but for now allow authenticated to insert for dev?
-- No, let's keep it restrictive.
-- (No insert policy for public/authenticated implies only service_role can insert, which is good for "App Store" control)
