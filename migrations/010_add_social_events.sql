-- Create social_events table (renamed from events to avoid conflict with racing series events)
create table if not exists public.social_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location_name text,
  address text,
  city text,
  state text,
  latitude float,
  longitude float,
  organizer_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('social', 'meetup', 'track_day', 'watch_party', 'drinks')),
  is_public boolean default true
);

-- Enable RLS on social_events
alter table public.social_events enable row level security;

-- Policies for social_events
create policy "Social Events are viewable by everyone" 
  on public.social_events for select 
  using (true);

create policy "Users can create social events" 
  on public.social_events for insert 
  with check (auth.uid() = organizer_id);

create policy "Users can update their own social events" 
  on public.social_events for update 
  using (auth.uid() = organizer_id);

create policy "Users can delete their own social events" 
  on public.social_events for delete 
  using (auth.uid() = organizer_id);

-- Create social_event_attendees table
create table if not exists public.social_event_attendees (
  event_id uuid references public.social_events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('going', 'interested', 'not_going')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- Enable RLS on social_event_attendees
alter table public.social_event_attendees enable row level security;

-- Policies for social_event_attendees
create policy "Social Attendance is viewable by everyone" 
  on public.social_event_attendees for select 
  using (true);

create policy "Users can RSVP themselves (social)" 
  on public.social_event_attendees for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own RSVP (social)" 
  on public.social_event_attendees for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own RSVP (social)" 
  on public.social_event_attendees for delete 
  using (auth.uid() = user_id);
