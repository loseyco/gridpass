-- Add visibility to collections
create type public.collection_visibility as enum ('Public', 'Private', 'Unlisted', 'Team');

alter table public.collections 
add column visibility public.collection_visibility default 'Public' not null;

-- Update RLS policies to respect visibility
drop policy if exists "Collections are viewable by everyone" on public.collections;

create policy "Collections are viewable based on visibility"
  on public.collections for select
  using (
    (visibility = 'Public') OR
    (owner_type = 'user' and owner_id = auth.uid()) OR
    (owner_type = 'team' and exists (
      select 1 from public.team_members tm
      where tm.team_id = c.owner_id and tm.user_id = auth.uid()
    ))
  );
