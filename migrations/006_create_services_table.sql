-- Create services table
create table if not exists user_services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10, 2), -- 10 digits, 2 decimal places
  unit text default 'fixed', -- 'fixed', 'hourly', 'daily', etc.
  photo_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table user_services enable row level security;

-- Policies
create policy "Public services are viewable by everyone"
  on user_services for select
  using ( true );

create policy "Users can insert their own services"
  on user_services for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own services"
  on user_services for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own services"
  on user_services for delete
  using ( auth.uid() = user_id );

-- Create storage path for service images (reusing garage bucket or new folder)
-- We will use 'garage/services/{user_id}/{filename}' structure
