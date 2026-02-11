-- Add notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  message text,
  type text default 'info', -- 'alert', 'success', 'nudge', 'warning'
  link text, -- Optional deep link
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS for Notifications
alter table public.notifications enable row level security;

-- Drop policy if exists to avoid error on re-run (safe way)
drop policy if exists "Users can view their own notifications" on public.notifications;

create policy "Users can view their own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );
