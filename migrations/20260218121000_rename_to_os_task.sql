-- Rename table from os_tasks to os_task
ALTER TABLE IF EXISTS public.os_tasks RENAME TO os_task;

-- If os_task didn't exist (because we might have failed earlier or it was named something else), create it effectively
-- But since we just created os_tasks, we are good.

-- However, we should also check if 'tasks' table is in the way or if we want to use 'tasks'.
-- The user said "can we just call it task or something".
-- "task" is a reserved word in some contexts, but usually fine as table name in Postgres if quoted, but 'os_task' is safer and follows convention.
-- I will assume they meant the *Concept* / *App* name, but if they meant table name, 'os_task' is the best middle ground.
-- I will keep the table as 'os_task' (singular) to match their request "call it task".

-- Update RLS policies to reference new table name
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.os_task;
DROP POLICY IF EXISTS "Users can see their own tasks" ON public.os_task;

CREATE POLICY "Enable all access for super admins"
ON public.os_task
FOR ALL
TO authenticated
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);

CREATE POLICY "Users can see their own tasks"
ON public.os_task
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'superadmin'
  )
);
