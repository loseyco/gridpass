-- Create Projects Table
CREATE TABLE IF NOT EXISTS public.garage_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES public.user_vehicles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Owner of the project
  name text NOT NULL,
  description text,
  status text DEFAULT 'planning', -- planning, in_progress, completed, on_hold
  start_date date,
  target_end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Project Members Table (Team Roster)
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.garage_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- owner, admin, member, mechanic, driver
  status text DEFAULT 'pending', -- pending, accepted, declined
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.garage_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo', -- todo, in_progress, review, done
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments on tasks could be a future enhancement, keeping it simple for now.

-- RLS Policies

ALTER TABLE public.garage_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Projects:
-- Owners can do everything
CREATE POLICY "Users can manage their own projects" ON public.garage_projects
  FOR ALL USING (auth.uid() = user_id);

-- Members can view projects they are part of
CREATE POLICY "Members can view projects" ON public.garage_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = garage_projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project Members:
-- Project owners can manage members
CREATE POLICY "Project owners can manage members" ON public.project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.garage_projects
      WHERE garage_projects.id = project_members.project_id
      AND garage_projects.user_id = auth.uid()
    )
  );

-- Users can view members of projects they are in
CREATE POLICY "Members can view other members" ON public.project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );
  
-- Users can see their own membership (needed for the EXISTS checks to work smoothly?)
-- Actually the above covers it if they are in the table.

-- Tasks:
-- Project owners and members can view and create tasks
CREATE POLICY "Members can view and create tasks" ON public.project_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Note: We might want to restrict DELETING tasks to owners/admins effectively, but for now trusting the team.
