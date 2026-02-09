-- Services Schema

create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  price numeric, -- stored as numeric for precision
  currency text default 'USD',
  image_url text, -- optional cover image
  category text, -- optional categorization e.g., 'Coaching', 'Setup', 'Repair'
  tags text[], -- searchable tags
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.services enable row level security;

-- Policies
create policy "Services are viewable by everyone" 
  on public.services for select using (true);

create policy "Users can insert their own services" 
  on public.services for insert with check (auth.uid() = user_id);

create policy "Users can update their own services" 
  on public.services for update using (auth.uid() = user_id);

create policy "Users can delete their own services" 
  on public.services for delete using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_services_user_id on public.services(user_id);
create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_is_active on public.services(is_active);
