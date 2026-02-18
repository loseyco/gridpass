-- Add category and parent_id to os_task
ALTER TABLE public.os_task 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.os_task(id) ON DELETE SET NULL;

-- Create index for parent_id to speed up recursive lookups if we do them
CREATE INDEX IF NOT EXISTS idx_os_task_parent_id ON public.os_task(parent_id);
CREATE INDEX IF NOT EXISTS idx_os_task_category ON public.os_task(category);
