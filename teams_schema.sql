-- Race Team Manager Schema

-- 1. Teams
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) not null,
  logo_url text,
  description text,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Team Members
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'driver', 'mechanic', 'spotter', 'guest')),
  status text default 'active' check (status in ('invited', 'active', 'suspended')),
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- 3. Events (Race Weekends, Tests)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  name text not null, -- "Round 1: Watkins Glen"
  type text default 'race' check (type in ('race', 'test', 'track_day', 'meeting', 'sim_race')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text, -- Track name or address
  track_id text, -- Optional reference to open track db if we had one
  description text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- 4. Logistics Items (Who brings what)
create table if not exists public.logistics_items (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null, -- "Trailer", "Generator", "Spare Tires"
  category text default 'general' check (category in ('general', 'transport', 'tools', 'parts', 'catering', 'accommodation')),
  assigned_to_user_id uuid references auth.users(id), -- Null means "someone needs to grab this"
  status text default 'needed' check (status in ('needed', 'assigned', 'packed', 'ready')),
  quantity integer default 1,
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.logistics_items enable row level security;

-- Policies

-- Teams: Viewable by members, editable by admins/owners
create policy "Members can view teams" on public.teams
  for select using (
    exists (select 1 from public.team_members where team_id = public.teams.id and user_id = auth.uid())
    or owner_id = auth.uid()
  );

create policy "Owners can update teams" on public.teams
  for update using (owner_id = auth.uid());

create policy "Users can create teams" on public.teams
  for insert with check (owner_id = auth.uid());

-- Members: Viewable by team members
create policy "Members can view other members" on public.team_members
  for select using (
    exists (select 1 from public.team_members Tm where Tm.team_id = team_members.team_id and Tm.user_id = auth.uid())
  );

-- Events: Viewable by team members
create policy "Team members can view events" on public.events
  for select using (
    exists (select 1 from public.team_members where team_id = events.team_id and user_id = auth.uid())
  );

create policy "Team admins can manage events" on public.events
  for all using (
    exists (select 1 from public.team_members where team_id = events.team_id and user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- Logistics: Viewable/Editable by team members
create policy "Team members can manage logistics" on public.logistics_items
  for all using (
    exists (
      select 1 from public.events E
      join public.team_members TM on E.team_id = TM.team_id
      where E.id = logistics_items.event_id and TM.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_events_team on public.events(team_id);
create index if not exists idx_logistics_event on public.logistics_items(event_id);
