-- Create feedback_submissions table
create table if not exists public.feedback_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('bug', 'feature', 'contact', 'other')),
  title text,
  message text not null,
  page_url text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.feedback_submissions enable row level security;

-- Policies for feedback_submissions
-- Users can insert their own feedback
create policy "Users can insert feedback"
  on public.feedback_submissions for insert
  with check (true);

-- Users can view their own feedback (optional, maybe not needed for now)
create policy "Users can view own feedback"
  on public.feedback_submissions for select
  using (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on public.feedback_submissions for select
  using (
    exists (
      select 1 from public.roles
      where user_id = auth.uid()
      and role in ('Super Admin', 'Founder')
    )
  );

-- Admins can update feedback status
create policy "Admins can update feedback status"
  on public.feedback_submissions for update
  using (
    exists (
      select 1 from public.roles
      where user_id = auth.uid()
      and role in ('Super Admin', 'Founder')
    )
  );
