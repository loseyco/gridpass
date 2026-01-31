-- Enable Realtime for GridPass Desktop tables
begin;
  -- Remove if already exists to avoid error (optional, but add table is idempotent-ish in standard pg, but supabase publication management is specific)
  -- The standard way is:
  alter publication supabase_realtime add table public.devices;
  alter publication supabase_realtime add table public.command_queue;
  alter publication supabase_realtime add table public.sessions;
commit;
