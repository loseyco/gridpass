-- Fix recursion between teams and team_members policies

-- 1. Create helper to check membership safely
create or replace function public.is_team_member(team_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1
    and user_id = auth.uid()
  );
$$;

-- 2. Drop problematic teams policy
drop policy if exists "Members can view teams" on public.teams;

-- 3. Re-create using the function to break RLS cycle
create policy "Members can view teams" on public.teams
  for select using (
    owner_id = auth.uid()
    or
    public.is_team_member(id)
  );

-- Also ensure team_members policy is using the helper (optional, previous fix used get_team_role which is fine)
-- But let's verify team_members policy doesn't trigger teams rls.
-- team_members policy checks: exists (select 1 from public.teams ... owner_id = auth.uid())
-- This queries teams. teams policy now uses is_team_member (which queries team_members safely).
-- Cycle: team_members policy -> teams query -> teams policy -> is_team_member -> team_members query (safe due to security definer)
-- This breaks the rls cycle.
