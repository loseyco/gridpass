create table if not exists sys_qr_redirects (
    id text primary key,
    target_url text not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table sys_qr_redirects enable row level security;

create policy "Public read redirects"
    on sys_qr_redirects for select
    using (true);

create policy "Auth users can manage redirects"
    on sys_qr_redirects for all
    using (auth.role() = 'authenticated');
