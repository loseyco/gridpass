-- Create ADS table for the Internal Ad System
create table if not exists os_ads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  image_url text not null,
  headline text not null,
  tier text check (tier in ('FREE', 'PRO')) default 'FREE',
  active boolean default false,
  created_at timestamptz default now()
);

-- Create CALENDAR_EVENTS table for the Schedule Scene
create table if not exists os_calendar_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  series text not null,
  start_time timestamptz not null,
  channel text,
  created_by uuid references auth.users(id)
);

-- Enable RLS (Security)
alter table os_ads enable row level security;
alter table os_calendar_events enable row level security;

-- Create Policies (Permissions)
create policy "Public read ads" on os_ads for select using (true);
create policy "Users can insert their own ads" on os_ads for insert with check (auth.uid() = user_id);
create policy "Public read calendar" on os_calendar_events for select using (true);
