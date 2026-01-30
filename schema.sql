-- 0. Cleanup prefixes
drop table if exists public.gp_roles;

-- 1. System Registry (Automation)
create table if not exists public.sys_api_registry (
  path text not null,
  method text not null,
  status text check (status in ('verified', 'failed', 'untested')) default 'untested',
  default_body jsonb,
  last_checked_at timestamptz default now(),
  primary key (path, method)
);

-- 2. Profiles (Extends Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  real_world_info jsonb default '{}'::jsonb,
  driver_info jsonb default '{}'::jsonb,
  mechanic_info jsonb default '{}'::jsonb,
  emergency_contact jsonb default '{}'::jsonb, -- Private
  logistics_info jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Roles & Badges
create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('Super Admin', 'Founder', 'Driver', 'Sim Racer', 'Mechanic', 'Team Principal')),
  verified boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- 3.5 Transactions (Found in code)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount decimal(10,2) not null,
  description text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- 3.6 Features (Roadmap)
create table if not exists public.features (
  id uuid default gen_random_uuid() primary key,
  title text unique not null,
  description text,
  status text default 'planned',
  priority text default 'medium',
  tier text default 'core',
  category text default 'General',
  votes integer default 0,
  estimated_hours integer,
  assigned_expert text,
  created_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.sys_api_registry enable row level security;

-- 5. Policies
-- Profiles: Public Read
drop policy if exists "Public Profiles are viewable by everyone" on public.profiles;
create policy "Public Profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- Profiles: Self Update
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Profiles: Insert (Trigger usually handles this, but allowing self-insert for auth flow)
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Roles: Public Read
drop policy if exists "Roles are viewable by everyone" on public.roles;
create policy "Roles are viewable by everyone"
  on public.roles for select
  using ( true );
  
-- Roles: Super Admin Only Update (Simplification for restoration)
drop policy if exists "Service Role or Super Admin can manage roles" on public.roles;
create policy "Service Role or Super Admin can manage roles"
  on public.roles for all
  using ( 
    auth.uid() in (
        select id from public.profiles where username = 'pjlosey' -- Bootstrap
    ) 
    or 
    (select count(*) from public.roles where user_id = auth.uid() and role = 'Super Admin') > 0
  );
