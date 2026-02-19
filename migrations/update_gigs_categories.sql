
-- Add category to os_gigs
ALTER TABLE os_gigs 
ADD COLUMN category text NOT NULL DEFAULT 'personnel' 
CHECK (category IN ('personnel', 'housing', 'transport', 'parts', 'other'));

-- Add budget_description for non-daily rate items
ALTER TABLE os_gigs
ADD COLUMN budget_description text; 

-- Comment: "Daily Rate" can be re-used as "Price" or "Budget"
