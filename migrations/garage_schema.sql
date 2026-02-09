-- Garage Schema: Vehicles and Tools

-- 1. User Vehicles
create table if not exists public.user_vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('Sim Rig', 'Race Car', 'Street Car', 'Trailer', 'Kart', 'Other')),
  year integer,
  make text not null,
  model text not null,
  description text,
  specs jsonb default '{}'::jsonb,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. User Tools
create table if not exists public.user_tools (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text, -- e.g. "Hand Tools", "Power Tools", "Diagnostics"
  name text not null,
  brand text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. RLS Policies
alter table public.user_vehicles enable row level security;
alter table public.user_tools enable row level security;

-- Vehicles: Public Read
create policy "Public Vehicles are viewable by everyone"
  on public.user_vehicles for select
  using ( true );

-- Vehicles: Owner Manage
create policy "Users can manage their own vehicles"
  on public.user_vehicles for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Tools: Public Read
create policy "Public Tools are viewable by everyone"
  on public.user_tools for select
  using ( true );

-- Tools: Owner Manage
create policy "Users can manage their own tools"
  on public.user_tools for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 4. Indexes
create index if not exists idx_user_vehicles_user_id on public.user_vehicles(user_id);
create index if not exists idx_user_tools_user_id on public.user_tools(user_id);
