-- Create os_matches table for Tinder-style swiping
create table if not exists public.os_matches (
  id uuid not null default gen_random_uuid (),
  initiator_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid not null, -- Can be a user_id (for teams swiping candidates) or a job_id (for workers swiping jobs)
  target_type text not null check (target_type in ('job', 'gig', 'candidate')),
  status text not null check (status in ('like', 'pass', 'superlike')),
  created_at timestamp with time zone not null default now(),
  constraint os_matches_pkey primary key (id),
  constraint os_matches_initiator_target_unique unique (initiator_id, target_id)
);

-- Enable RLS
alter table public.os_matches enable row level security;

-- Policies
create policy "Users can view their own matches" on public.os_matches
  for select using (auth.uid() = initiator_id);

create policy "Users can insert their own matches" on public.os_matches
  for insert with check (auth.uid() = initiator_id);

-- Indexes for performance
create index matches_initiator_idx on public.os_matches (initiator_id);
create index matches_target_idx on public.os_matches (target_id);
