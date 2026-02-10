-- Create resume_leads table for the Resume Builder Service
create table if not exists public.resume_leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Contact Info
  name text not null,
  email text not null,
  phone text,
  
  -- Professional Info
  job_title text, -- Renamed from current_role to avoid reserved keyword
  experience_years text, -- e.g. "0-2", "3-5", "5+"
  bio text,
  linkedin_url text,
  portfolio_url text,
  
  -- Workflow
  status text check (status in ('new', 'contacted', 'paid', 'built', 'live', 'archived')) default 'new',
  stripe_payment_link text,
  admin_notes text
);

-- Enable RLS
alter table public.resume_leads enable row level security;

-- Policies

-- Public can insert (Intake Form)
drop policy if exists "Public can submit resume leads" on public.resume_leads;
create policy "Public can submit resume leads"
  on public.resume_leads
  for insert
  with check (true);

-- Only Admins can view/update
drop policy if exists "Admins can view all resume leads" on public.resume_leads;
create policy "Admins can view all resume leads"
  on public.resume_leads
  for select
  using (
    auth.uid() in (
        select id from public.profiles where username = 'pjlosey'
    ) 
    or 
    (select count(*) from public.roles where user_id = auth.uid() and role = 'Super Admin') > 0
  );

drop policy if exists "Admins can update resume leads" on public.resume_leads;
create policy "Admins can update resume leads"
  on public.resume_leads
  for update
  using (
    auth.uid() in (
        select id from public.profiles where username = 'pjlosey'
    ) 
    or 
    (select count(*) from public.roles where user_id = auth.uid() and role = 'Super Admin') > 0
  );

-- Grant permissions
grant all on public.resume_leads to authenticated;
grant all on public.resume_leads to service_role;
grant insert on public.resume_leads to anon;
