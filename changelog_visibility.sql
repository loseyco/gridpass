-- Add is_public column
ALTER TABLE changelogs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Drop existing public policy to replace it
DROP POLICY IF EXISTS "Public can view changelogs" ON changelogs;

-- New Public Policy: Only see public logs
CREATE POLICY "Public can view changelogs" 
  ON changelogs FOR SELECT 
  USING (is_public = true);

-- New Admin Policy: See ALL logs (including hidden)
DROP POLICY IF EXISTS "Admins can view all changelogs" ON changelogs;
CREATE POLICY "Admins can view all changelogs" 
  ON changelogs FOR SELECT 
  USING (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('superadmin', 'admin')
    )
  );
