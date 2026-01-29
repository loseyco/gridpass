-- 1. Orgs
create table if not exists public.orgs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,
  slug text unique not null,
  status text default 'active',
  created_at timestamptz default now()
);

-- 2. Jobs
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  type text default 'Full Time',
  location text,
  status text default 'active',
  created_at timestamptz default now()
);

-- 3. Tracks
create table if not exists public.tracks (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  location text,
  created_at timestamptz default now()
);

-- 4. Events
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  track_id uuid references public.tracks(id),
  season_year integer,
  series text,
  start_date timestamptz,
  end_date timestamptz,
  status text default 'scheduled',
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- 5. Listings
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  price decimal(10,2),
  category text,
  status text default 'active',
  created_at timestamptz default now()
);

-- 6. Threads (Messaging)
create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  participants uuid[], -- Array of user IDs
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 7. Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  message text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- 9. Tasks
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  status text default 'todo',
  due_date timestamptz,
  created_at timestamptz default now()
);

-- 10. Inventory
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.orgs(id),
  name text not null,
  quantity integer default 0,
  sku text,
  created_at timestamptz default now()
);


-- ENABLE RLS
alter table public.orgs enable row level security;
alter table public.jobs enable row level security;
alter table public.tracks enable row level security;
alter table public.events enable row level security;
alter table public.listings enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.tasks enable row level security;
alter table public.inventory enable row level security;


-- POLICIES (Simplified for speed)

-- Public Reads
create policy "Public Read Orgs" on public.orgs for select using (true);
create policy "Public Read Jobs" on public.jobs for select using (true);
create policy "Public Read Tracks" on public.tracks for select using (true);
create policy "Public Read Events" on public.events for select using (true);
create policy "Public Read Listings" on public.listings for select using (true);

-- User Write Own
create policy "Users manage own jobs" on public.jobs for all using (auth.uid() = user_id);
create policy "Users manage own listings" on public.listings for all using (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);

-- Messaging
create policy "Users access threads they participate in" on public.threads for all using (auth.uid() = any(participants));
create policy "Users access messages in their threads" on public.messages for select using (
  exists (select 1 from public.threads where id = thread_id and auth.uid() = any(participants))
);
create policy "Users send messages" on public.messages for insert with check (auth.uid() = user_id);

-- Creator Policies
create policy "Users create events" on public.events for insert with check (auth.uid() = created_by);
create policy "Users create orgs" on public.orgs for insert with check (true); -- Allow all for now
