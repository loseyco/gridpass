-- Create services table if it doesn't exist
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


-- Seed Resume Review Service
do $$
declare
  admin_id uuid;
begin
  -- Try to find an admin user (pjlos or first user) to assign the service to
  select id into admin_id from auth.users where email like '%pjlos%' limit 1;
  
  -- If no specific admin, fallback to any user or specific ID if known. 
  -- If no users exist, this insert will fail or be skipped.
  if admin_id is null then
    select id into admin_id from auth.users limit 1;
  end if;

  if admin_id is not null then
    if not exists (select 1 from public.services where title ilike '%Resume Review%') then
      insert into public.services (user_id, title, description, price, category, tags)
      values (
        admin_id,
        'Resume Review & Career Consultation',
        'Professional review of your racing resume.',
        20,
        'Consultation',
        ARRAY['resume', 'career']
      );
    else
        -- Update price to 20 if it exists
        update public.services set price = 20 where title ilike '%Resume Review%';
    end if;
  end if;
end $$;
