-- Create os_tasks table
create table if not exists public.os_tasks (
    id uuid not null default gen_random_uuid(),
    user_id uuid default auth.uid(),
    title text not null,
    description text,
    status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'archived')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
    tags text[] default array[]::text[],
    context jsonb default '{}'::jsonb,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint os_tasks_pkey primary key (id)
);

-- Enable RLS
alter table public.os_tasks enable row level security;

-- Policies
create policy "Enable all access for super admins"
on public.os_tasks
for all
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);

-- Fallback for development/testing (optional, remove if strict)
-- allowing user to see their own tasks if we ever want per-user tasks later
create policy "Users can see their own tasks"
on public.os_tasks
for select
to authenticated
using (
  user_id = auth.uid() OR
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);
