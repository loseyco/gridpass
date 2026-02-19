
ALTER TABLE os_placements DROP CONSTRAINT IF EXISTS os_placements_status_check;

ALTER TABLE os_placements ADD CONSTRAINT os_placements_status_check 
CHECK (status IN ('applied', 'interviewing', 'offered', 'hired', 'invoiced', 'paid', 'rejected', 'pending'));
