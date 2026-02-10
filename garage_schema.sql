-- Virtual Garage Schema

-- 1. Vehicles (Sim & Real)
create table if not exists public.vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, -- "My GT3 RS" or "iRacing F3"
  type text not null check (type in ('real', 'sim')),
  make text,
  model text,
  year integer,
  vin text, -- Real cars only
  sim_platform text, -- iRacing, ACC, etc.
  description text,
  image_url text,
  metadata jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Parts (Asset Tracking)
create table if not exists public.parts (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  name text not null, -- "Front Brake Pads", "Fanatec Wheel Base"
  part_number text,
  category text, -- "Brakes", "Engine", "Suspension", "Electronics"
  status text default 'good' check (status in ('good', 'worn', 'failed', 'replaced')),
  installation_date timestamptz,
  mileage_at_install integer, -- km or miles
  hours_at_install numeric(10,2),
  current_mileage integer, -- Calculated or updated
  current_hours numeric(10,2),
  lifespan_mileage integer, -- Estimated life
  lifespan_hours numeric(10,2), -- Estimated life
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Maintenance Logs (Service History)
create table if not exists public.maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  date timestamptz default now(),
  title text not null, -- "Oil Change", "Firmware Update"
  description text,
  mileage integer,
  hours numeric(10,2),
  cost numeric(10,2),
  currency text default 'USD',
  performed_by text, -- "Self", "Shop Name"
  attachment_urls text[], -- Receipts, photos
  type text default 'maintenance' check (type in ('maintenance', 'repair', 'upgrade', 'setup')),
  created_at timestamptz default now()
);

-- 4. Setups (Tuning Files)
create table if not exists public.setups (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  name text not null, -- "Spa Wet Setup", "Qualifying Baseline"
  track text,
  conditions text, -- "Wet", "Hot", "Night"
  file_url text, -- Link to storage
  data jsonb, -- Raw values if parsed
  notes text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.vehicles enable row level security;
alter table public.parts enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.setups enable row level security;

-- Policies
-- Vehicles
create policy "Users can manage own vehicles" on public.vehicles
  for all using (auth.uid() = user_id);

-- Parts
create policy "Users can manage own parts" on public.parts
  for all using (
    vehicle_id in (select id from public.vehicles where user_id = auth.uid())
  );

-- Logs
create policy "Users can manage own logs" on public.maintenance_logs
  for all using (
    vehicle_id in (select id from public.vehicles where user_id = auth.uid())
  );

-- Setups
create policy "Users can manage own setups" on public.setups
  for all using (
    vehicle_id in (select id from public.vehicles where user_id = auth.uid())
  );

-- Indexes
create index if not exists idx_vehicles_user on public.vehicles(user_id);
create index if not exists idx_parts_vehicle on public.parts(vehicle_id);
create index if not exists idx_logs_vehicle on public.maintenance_logs(vehicle_id);
create index if not exists idx_setups_vehicle on public.setups(vehicle_id);
