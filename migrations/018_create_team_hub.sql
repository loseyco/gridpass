-- Create teams table
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

-- Create team_members table
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'driver', 'mechanic', 'spotter', 'guest')),
  status text default 'active' check (status in ('invited', 'active', 'suspended')),
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Policies for teams

-- Viewable by members, editable by admins/owners
create policy "Members can view teams" on public.teams
  for select using (
    exists (select 1 from public.team_members where team_id = public.teams.id and user_id = auth.uid())
    or owner_id = auth.uid()
  );

create policy "Owners can update teams" on public.teams
  for update using (owner_id = auth.uid());

create policy "Users can create teams" on public.teams
  for insert with check (owner_id = auth.uid());

-- Policies for team_members

-- Members can view other members of their team
create policy "Members can view other members" on public.team_members
  for select using (
    exists (select 1 from public.team_members Tm where Tm.team_id = public.team_members.team_id and Tm.user_id = auth.uid())
    or 
    exists (select 1 from public.teams T where T.id = public.team_members.team_id and T.owner_id = auth.uid())
  );

-- Admins/Owners can manage members
create policy "Admins can manage members" on public.team_members
  for all using (
    exists (
      select 1 from public.team_members Tm 
      where Tm.team_id = public.team_members.team_id 
      and Tm.user_id = auth.uid() 
      and Tm.role in ('owner', 'admin')
    )
    or
    exists (select 1 from public.teams T where T.id = public.team_members.team_id and T.owner_id = auth.uid())
  );

-- Indexes
create index if not exists idx_teams_owner on public.teams(owner_id);
create index if not exists idx_teams_slug on public.teams(slug);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_team_members_team on public.team_members(team_id);
