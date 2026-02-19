-- Add job_id to os_matches to link matches to specific jobs
ALTER TABLE os_matches ADD COLUMN job_id UUID REFERENCES os_jobs(id);

-- Add logic to handle 'invited' and 'applied' status if deemed necessary by check constraints
-- (Assuming standard text field for status, so no enum change needed yet)
