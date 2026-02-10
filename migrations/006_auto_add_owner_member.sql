-- Trigger to automatically add project owner to project_members
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_project_created ON public.garage_projects;

-- Create trigger
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.garage_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();
