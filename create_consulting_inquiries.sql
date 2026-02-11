-- Create Consulting Inquiries Table
create table if not exists public.consulting_inquiries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  service_type text default 'automotive', -- 'automotive', 'estate_manager', 'general'
  status text default 'pending' check (status in ('pending', 'read', 'replied', 'archived')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.consulting_inquiries enable row level security;

-- Policies
-- 1. Public can insert inquiries (no auth required for potential clients)
create policy "Public can submit consulting inquiries" 
on public.consulting_inquiries for insert 
with check (true);

-- 2. Authenticated users (PJ) can view inquiries
create policy "Authenticated users can view inquiries" 
on public.consulting_inquiries for select 
to authenticated
using (true);
