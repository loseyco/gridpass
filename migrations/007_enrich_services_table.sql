-- Add missing columns to user_services
alter table user_services 
add column if not exists currency text default 'USD',
add column if not exists category text,
add column if not exists tags text[],
add column if not exists is_active boolean default true;

-- Rename unit constraint check if needed, or just ensure default
alter table user_services alter column unit set default 'fixed';
