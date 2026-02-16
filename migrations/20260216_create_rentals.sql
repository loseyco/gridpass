-- Create rental_vehicles table
create table if not exists public.rental_vehicles (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'golf_cart', 'pit_bike', 'scooter', 'car', 'trailer'
  make text,
  model text,
  year int,
  description text,
  price_per_hour numeric,
  price_per_day numeric,
  currency text default 'USD',
  location_name text, -- e.g. "Indianapolis Motor Speedway"
  image_url text,
  status text default 'available', -- 'available', 'rented', 'maintenance', 'archived'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on rental_vehicles
alter table public.rental_vehicles enable row level security;

-- Policies for rental_vehicles
create policy "Rental Vehicles are viewable by everyone" 
  on public.rental_vehicles for select 
  using (true);

create policy "Users can insert their own rental vehicles" 
  on public.rental_vehicles for insert 
  with check (auth.uid() = owner_id);

create policy "Users can update their own rental vehicles" 
  on public.rental_vehicles for update 
  using (auth.uid() = owner_id);

create policy "Users can delete their own rental vehicles" 
  on public.rental_vehicles for delete 
  using (auth.uid() = owner_id);

-- Create rental_bookings table
create table if not exists public.rental_bookings (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references public.rental_vehicles(id) on delete cascade not null,
  renter_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_price numeric not null,
  currency text default 'USD',
  status text default 'pending', -- 'pending', 'confirmed', 'active', 'completed', 'cancelled'
  payment_status text default 'unpaid', -- 'unpaid', 'authorized', 'paid'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on rental_bookings
alter table public.rental_bookings enable row level security;

-- Policies for rental_bookings
create policy "Users can view their own bookings (as renter)" 
  on public.rental_bookings for select 
  using (auth.uid() = renter_id);

create policy "Owners can view bookings for their vehicles" 
  on public.rental_bookings for select 
  using (
    exists (
      select 1 from public.rental_vehicles 
      where id = rental_bookings.vehicle_id 
      and owner_id = auth.uid()
    )
  );

create policy "Users can create bookings" 
  on public.rental_bookings for insert 
  with check (auth.uid() = renter_id);

create policy "Users can update their own bookings" 
  on public.rental_bookings for update 
  using (auth.uid() = renter_id);

create policy "Owners can update bookings for their vehicles" 
  on public.rental_bookings for update 
  using (
    exists (
      select 1 from public.rental_vehicles 
      where id = rental_bookings.vehicle_id 
      and owner_id = auth.uid()
    )
  );

-- Indexes for performance
create index if not exists idx_rental_vehicles_owner_id on public.rental_vehicles(owner_id);
create index if not exists idx_rental_vehicles_status on public.rental_vehicles(status);
create index if not exists idx_rental_bookings_vehicle_id on public.rental_bookings(vehicle_id);
create index if not exists idx_rental_bookings_renter_id on public.rental_bookings(renter_id);
create index if not exists idx_rental_bookings_status on public.rental_bookings(status);
