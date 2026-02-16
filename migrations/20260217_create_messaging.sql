-- Create os_threads table
create table if not exists public.os_threads (
    id uuid not null default gen_random_uuid() primary key,
    participants uuid[] not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create os_messages table
create table if not exists public.os_messages (
    id uuid not null default gen_random_uuid() primary key,
    thread_id uuid not null references public.os_threads(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    read_at timestamptz,
    created_at timestamptz default now()
);

-- Create os_push_subscriptions table
create table if not exists public.os_push_subscriptions (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null unique,
    keys jsonb not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.os_threads enable row level security;
alter table public.os_messages enable row level security;
alter table public.os_push_subscriptions enable row level security;

-- Policies for os_threads
create policy "Users can view threads they are participants in"
    on public.os_threads for select
    using (auth.uid() = any(participants));

create policy "Users can create threads if they are a participant"
    on public.os_threads for insert
    with check (auth.uid() = any(participants));

-- Policies for os_messages
create policy "Users can view messages in threads they participate in"
    on public.os_messages for select
    using (
        exists (
            select 1 from public.os_threads
            where id = os_messages.thread_id
            and auth.uid() = any(participants)
        )
    );

create policy "Users can insert messages in threads they participate in"
    on public.os_messages for insert
    with check (
        exists (
            select 1 from public.os_threads
            where id = os_messages.thread_id
            and auth.uid() = any(participants)
        )
    );

create policy "Users can update their own messages (e.g. read status)"
    on public.os_messages for update
    using (sender_id = auth.uid());

-- Policies for os_push_subscriptions
create policy "Users can manage their own subscriptions"
    on public.os_push_subscriptions for all
    using (user_id = auth.uid());

-- Function to update thread updated_at on new message
create or replace function public.update_thread_updated_at()
returns trigger as $$
begin
    update public.os_threads
    set updated_at = now()
    where id = new.thread_id;
    return new;
end;
$$ language plpgsql;

create trigger update_thread_timestamp
after insert on public.os_messages
for each row
execute function public.update_thread_updated_at();

