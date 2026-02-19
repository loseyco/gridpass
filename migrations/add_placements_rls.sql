
-- Enable RLS (already enabled, but good practice to ensure)
ALTER TABLE os_placements ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own placements
CREATE POLICY "Users can insert their own placements"
ON os_placements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = recruiter_id);

-- Allow users to view their own placements
CREATE POLICY "Users can view their own placements"
ON os_placements
FOR SELECT
TO authenticated
USING (auth.uid() = recruiter_id);
