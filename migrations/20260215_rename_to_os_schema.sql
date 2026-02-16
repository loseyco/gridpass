-- Rename tables to match os_ convention
ALTER TABLE IF EXISTS public.org_services RENAME TO os_org_services;
ALTER TABLE IF EXISTS public.org_bookings RENAME TO os_org_bookings;
ALTER TABLE IF EXISTS public.org_hours RENAME TO os_org_hours;

-- It's good practice to rename constraints/indexes too but not strictly required for functionality
-- if access is just via table name. UUID keys and foreign keys persist.

-- However, trigger names or policy names might mention the old table? 
-- Policies are attached to the table, renaming the table usually preserves them attached to the new name.
