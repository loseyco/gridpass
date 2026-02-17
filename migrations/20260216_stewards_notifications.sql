-- Add notification tracking to stewards incidents
alter table public.os_stewards_incidents
add column if not exists last_notification_sent_at timestamptz,
add column if not exists notification_count int default 0;

-- Optional: Index for faster cron lookups
create index if not exists idx_stewards_incidents_notifications 
on public.os_stewards_incidents(created_at, notification_count)
where notification_count < 7;
