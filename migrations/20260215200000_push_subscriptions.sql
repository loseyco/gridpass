-- Create a table for push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Create policies
create policy "Users can insert their own subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

create policy "Users can view their own subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
