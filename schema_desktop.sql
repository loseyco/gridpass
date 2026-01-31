-- GridPass Desktop Backbone Schema

-- A. Devices Registry
create table if not exists public.devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id), -- Nullable: Device might be registered before user links it
  name text,
  hardware_id text unique not null,       -- Stable ID from the hardware (MAC or other)
  capabilities jsonb default '{}'::jsonb, -- { "iracing": true, "webcam": true }
  status text default 'offline',          -- online, offline, busy
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

-- B. Pairing Codes (Device Flow)
create table if not exists public.device_codes (
  code text primary key, -- 6 digit code, e.g. "ABC-123"
  device_hardware_id text not null, -- The device waiting for this code
  status text default 'pending', -- pending, linked, expired
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz default now()
);

-- C. Sessions (Active Connections)
create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  ip_address text,
  user_agent text,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- D. Telemetry Snapshots (History)
create table if not exists public.telemetry_snapshots (
  id uuid default gen_random_uuid() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete set null,
  type text default 'iracing', -- iracing, system, etc
  data jsonb not null, -- The telemetry payload
  captured_at timestamptz default now()
);

-- E. Command Queue (Web -> Device)
create table if not exists public.command_queue (
  id uuid default gen_random_uuid() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  command text not null,       -- "SHUTDOWN", "LAUNCH_IR", "RESET_CAR"
  payload jsonb default '{}'::jsonb,
  status text default 'pending', -- pending, sent, ack, failed
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- F. Enable RLS
alter table public.devices enable row level security;
alter table public.device_codes enable row level security;
alter table public.sessions enable row level security;
alter table public.telemetry_snapshots enable row level security;
alter table public.command_queue enable row level security;

-- G. Policies (Initial Permission Model)
-- Devices: Users can view their own devices (Fixed policy name to avoid collision just in case)
drop policy if exists "Users can view own devices" on public.devices;
create policy "Users can view own devices" on public.devices
  for select using ( auth.uid() = user_id );

-- Command Queue: Users can insert commands for their own devices
drop policy if exists "Users can command own devices" on public.command_queue;
create policy "Users can command own devices" on public.command_queue
  for insert with check (
    device_id in (select id from public.devices where user_id = auth.uid())
  );
