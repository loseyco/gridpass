-- Matchmaking Schema (Arrive & Drive)

-- 1. Racing Seats (Offers: "I have a seat")
create table if not exists public.racing_seats (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null, -- Optional link to a team
  vehicle_id uuid references public.vehicles(id) on delete set null, -- Optional link to a specific car
  title text not null, -- "Seat available for Lemons race at Buttonwillow"
  description text,
  price numeric(10, 2), -- Cost
  currency text default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  event_name text, -- "24 Hours of Lemons", "WRL COTA"
  event_date timestamptz,
  track_name text, -- "Buttonwillow", "Road Atlanta"
  car_info jsonb default '{}'::jsonb, -- { "make": "Mazda", "model": "Miata", "class": "C" }
  included_items text[], -- ["fuel", "tires", "entry_fee", "coaching", "damage_waiver"]
  requirements text[], -- ["license", "deposit", "experience"]
  status text default 'available' check (status in ('available', 'pending', 'filled', 'cancelled', 'expired')),
  contact_info jsonb, -- { "email": "...", "phone": "..." } or null if using platform chat
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Driver Requests (Demand: "I need a seat")
create table if not exists public.driver_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null, -- "Experienced Miata driver looking for seat"
  bio text, -- Brief driver bio/intro
  experience_level text check (experience_level in ('rookie', 'intermediate', 'advanced', 'pro')),
  budget numeric(10, 2),
  currency text default 'USD',
  preferred_region text, -- "West Coast", "Northeast"
  availability_start timestamptz,
  availability_end timestamptz,
  unavailability_dates timestamptz[],
  willing_to_travel boolean default true,
  status text default 'active' check (status in ('active', 'matched', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.racing_seats enable row level security;
alter table public.driver_requests enable row level security;

-- Policies

-- Racing Seats: Public read
create policy "Anyone can view racing seats" on public.racing_seats
  for select using (true);

-- Racing Seats: Owner manage
create policy "Users can manage own racing seats" on public.racing_seats
  for all using (auth.uid() = owner_id);

-- Driver Requests: Public read
create policy "Anyone can view driver requests" on public.driver_requests
  for select using (true);

-- Driver Requests: Owner manage
create policy "Users can manage own driver requests" on public.driver_requests
  for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_racing_seats_owner on public.racing_seats(owner_id);
create index if not exists idx_racing_seats_team on public.racing_seats(team_id);
create index if not exists idx_racing_seats_status on public.racing_seats(status);
create index if not exists idx_driver_requests_user on public.driver_requests(user_id);
create index if not exists idx_driver_requests_status on public.driver_requests(status);
