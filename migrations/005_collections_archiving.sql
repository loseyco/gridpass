-- Add archived_at and is_default columns to collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create index for archived_at
CREATE INDEX IF NOT EXISTS idx_collections_archived_at ON collections(archived_at);

-- Update existing collections:
-- We need to ensure every user has at least one default collection.
-- For now, let's set the OLDEST personal collection for each user as default.
WITH ranked_collections AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
  FROM collections
  WHERE owner_type = 'user'
)
UPDATE collections
SET is_default = TRUE
FROM ranked_collections
WHERE collections.id = ranked_collections.id AND ranked_collections.rn = 1;
