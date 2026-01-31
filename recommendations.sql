
-- Create Recommendations Table
create table if not exists public.recommendations (
  id uuid default gen_random_uuid() primary key,
  target_user_id uuid references public.profiles(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null, -- Null if public
  author_name text, -- Captured for public users or cache for easy display
  author_email text, -- Captured for public users (private)
  relationship text, -- "Teammate", "Client", "Employer", "Friend", "Other"
  content text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.recommendations enable row level security;

-- Policies

-- Public Read: Everyone can see APPROVED recommendations
create policy "Anyone can view approved recommendations"
  on public.recommendations for select
  using ( status = 'approved' );

-- Owner Read: Target user can see ALL recommendations for them (to approve)
create policy "Users can view recommendations for themselves"
  on public.recommendations for select
  using ( target_user_id = auth.uid() );

-- Public Insert: Anyone can create a recommendation
create policy "Anyone can submit a recommendation"
  on public.recommendations for insert
  with check ( true );

-- Owner Update: Target user can update status (approve/reject)
create policy "Users can manage recommendations for themselves"
  on public.recommendations for update
  using ( target_user_id = auth.uid() );
