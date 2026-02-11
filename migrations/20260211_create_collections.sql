-- Create Collections Table
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_type text not null check (owner_type in ('user', 'team')),
  owner_id uuid not null, -- Can be profile.id or team.id. RLS will handle validation.
  location text,
  type text check (type in ('Private', 'Museum', 'Commercial Fleet', 'Racing Team', 'Other')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on Collections
alter table public.collections enable row level security;

-- Policies for Collections

-- 1. Users can view their own collections
create policy "Users can view own collections"
  on public.collections for select
  using (
    (owner_type = 'user' and owner_id = auth.uid()) OR
    (owner_type = 'team' and exists (
      select 1 from public.team_members
      where team_id = collections.owner_id and user_id = auth.uid()
    ))
  );

-- 2. Users can create collections (for themselves or teams they are admin/owner of)
create policy "Users can create collections"
  on public.collections for insert
  with check (
    (owner_type = 'user' and owner_id = auth.uid()) OR
    (owner_type = 'team' and exists (
      select 1 from public.team_members
      where team_id = collections.owner_id and user_id = auth.uid() and role in ('owner', 'admin')
    ))
  );

-- 3. Users can update collections (same as create)
create policy "Users can update own collections"
  on public.collections for update
  using (
    (owner_type = 'user' and owner_id = auth.uid()) OR
    (owner_type = 'team' and exists (
      select 1 from public.team_members
      where team_id = collections.owner_id and user_id = auth.uid() and role in ('owner', 'admin')
    ))
  );

-- 4. Users can delete collections
create policy "Users can delete own collections"
  on public.collections for delete
  using (
    (owner_type = 'user' and owner_id = auth.uid()) OR
    (owner_type = 'team' and exists (
      select 1 from public.team_members
      where team_id = collections.owner_id and user_id = auth.uid() and role in ('owner', 'admin')
    ))
  );


-- Migration: Update user_vehicles to support collections
-- We will keep user_id for backward compatibility but make it nullable if vehicle is part of a team collection
-- Actually, a cleaner way is to keep user_vehicles as is for "Personal Garage" (legacy) and create a robust 'vehicles' table
-- But to follow the prompt's desire to "handle everything", let's migrate.

-- Add collection_id to user_vehicles
alter table public.user_vehicles 
  add column if not exists collection_id uuid references public.collections(id) on delete set null;

-- Add new fields for "Luxury" management
alter table public.user_vehicles
  add column if not exists status text check (status in ('Ready', 'Service Scheduled', 'In Transit', 'Track Prep', 'Restoration', 'Storage', 'Other')),
  add column if not exists vin text,
  add column if not exists acquisition_date date,
  add column if not exists purchase_price numeric,
  add column if not exists current_value numeric,
  add column if not exists location text; -- Specific location override

-- Update RLS for vehicles to include Collection access
-- Current policy: "Users can manage their own vehicles" using auth.uid() = user_id
-- We need to expand this.

drop policy if exists "Users can manage their own vehicles" on public.user_vehicles;

create policy "Users can manage their own vehicles"
  on public.user_vehicles for all
  using (
    (auth.uid() = user_id) OR 
    (collection_id is not null and exists (
      select 1 from public.collections c
      where c.id = user_vehicles.collection_id
      and (
        (c.owner_type = 'user' and c.owner_id = auth.uid()) OR
        (c.owner_type = 'team' and exists (
          select 1 from public.team_members tm
          where tm.team_id = c.owner_id and tm.user_id = auth.uid()
        ))
      )
    ))
  );
