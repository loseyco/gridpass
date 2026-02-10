-- Create Service Inquiries Table
create table if not exists public.service_inquiries (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references public.user_services(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  sender_phone text,
  message text not null,
  project_details jsonb default '{}'::jsonb, -- budget, timeline, etc.
  status text default 'pending' check (status in ('pending', 'read', 'replied', 'archived')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.service_inquiries enable row level security;

-- Policies
-- 1. Service Owner can view inquiries for their services
create policy "Service Owners can view their inquiries" 
on public.service_inquiries for select 
using (
    exists (
        select 1 from public.user_services 
        where public.user_services.id = public.service_inquiries.service_id 
        and public.user_services.user_id = auth.uid()
    )
);

-- 2. Public can insert inquiries (no auth required for leads)
create policy "Public can submit inquiries" 
on public.service_inquiries for insert 
with check (true);

-- Indexes
create index if not exists idx_service_inquiries_service_id on public.service_inquiries(service_id);
