-- Fix RLS Infinite Recursion by using SECURITY DEFINER functions

-- Function to check membership without triggering RLS on project_members table
CREATE OR REPLACE FUNCTION public.is_member_of_project(_project_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Members can view projects" ON public.garage_projects;
DROP POLICY IF EXISTS "Members can view other members" ON public.project_members;
DROP POLICY IF EXISTS "Members can view and create tasks" ON public.project_tasks;

-- Re-create policies using the function

-- Garage Projects
CREATE POLICY "Members can view projects" ON public.garage_projects
  FOR SELECT USING (
    is_member_of_project(id)
  );

-- Project Members
-- Allow users to see project members if they are also a member of that project
CREATE POLICY "Members can view other members" ON public.project_members
  FOR SELECT USING (
    is_member_of_project(project_id)
  );

-- Project Tasks
CREATE POLICY "Members can view and create tasks" ON public.project_tasks
  FOR ALL USING (
    is_member_of_project(project_id)
  );
