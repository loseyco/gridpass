-- Create concierge_tasks table
create type public.concierge_task_type as enum (
  'Sourcing', 
  'Logistics', 
  'Maintenance', 
  'Travel', 
  'Detailing', 
  'Storage', 
  'Driving', 
  'Sales', 
  'Event', 
  'Other'
);

create type public.concierge_task_status as enum (
  'Pending', 
  'In Progress', 
  'Completed', 
  'Cancelled'
);

create type public.billing_method as enum (
  'Fixed', 
  'Hourly', 
  'Commission', 
  'Reimbursement'
);

create type public.invoice_status as enum (
  'Unbilled', 
  'Invoiced', 
  'Paid'
);

create table if not exists public.concierge_tasks (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  vehicle_id uuid references public.user_vehicles(id) on delete set null, -- Optional, task might be general
  
  type public.concierge_task_type not null,
  status public.concierge_task_status default 'Pending',
  
  title text not null,
  description text,
  
  -- Scheduling
  scheduled_date timestamptz,
  completed_date timestamptz,
  
  -- Billing
  billing_method public.billing_method default 'Fixed',
  estimated_cost numeric(10, 2),
  actual_cost numeric(10, 2), -- Internal cost
  client_price numeric(10, 2), -- What client is charged
  commission_rate numeric(5, 2), -- Percentage e.g. 5.00 for 5%
  hours_logged numeric(6, 2) default 0,
  hourly_rate numeric(10, 2),
  invoice_status public.invoice_status default 'Unbilled',
  
  attachments text[], -- Array of URLs
  
  assigned_to uuid references auth.users(id), -- Specific team member handling this
  created_by uuid references auth.users(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.concierge_tasks enable row level security;

-- Policy: Users can view/manage tasks if they have access to the collection
create policy "Users can manage tasks for their collections"
  on public.concierge_tasks for all
  using (
    exists (
      select 1 from public.collections c
      where c.id = concierge_tasks.collection_id
      and (
        (c.owner_type = 'user' and c.owner_id = auth.uid()) OR
        (c.owner_type = 'team' and exists (
          select 1 from public.team_members tm
          where tm.team_id = c.owner_id and tm.user_id = auth.uid()
        ))
      )
    )
  );

-- Indexes
create index idx_concierge_tasks_collection_id on public.concierge_tasks(collection_id);
create index idx_concierge_tasks_vehicle_id on public.concierge_tasks(vehicle_id);
create index idx_concierge_tasks_status on public.concierge_tasks(status);
