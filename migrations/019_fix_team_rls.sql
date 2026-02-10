-- Fix recursive RLS policies on team_members

-- 1. Create a helper function to check role without triggering RLS recursion
create or replace function public.get_team_role(team_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from public.team_members
  where team_id = $1
  and user_id = auth.uid();
$$;

-- 2. Drop existing problematic policies
drop policy if exists "Members can view other members" on public.team_members;
drop policy if exists "Admins can manage members" on public.team_members;

-- 3. Re-create policies using the helper function

-- Members can view other members of their team
create policy "Members can view other members" on public.team_members
  for select using (
    -- I am a member of this team
    (public.get_team_role(team_id) is not null)
    or 
    -- I am the owner of this team (checked via teams table which is safe)
    exists (select 1 from public.teams T where T.id = team_members.team_id and T.owner_id = auth.uid())
  );

-- Admins/Owners can manage members
create policy "Admins can manage members" on public.team_members
  for all using (
    -- I am an owner or admin
    (public.get_team_role(team_id) in ('owner', 'admin'))
    or
    -- I am the owner (checked via teams table)
    exists (select 1 from public.teams T where T.id = team_members.team_id and T.owner_id = auth.uid())
  );
