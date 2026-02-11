const fs = require('fs');
const path = require('path');

console.log(`
=======================================================
ACTION REQUIRED: RUN DATABASE MIGRATION
=======================================================

Please run the following SQL in your Supabase Dashboard (SQL Editor) to enable Collection Archiving and Profile filtering:

-- 1. Add columns
ALTER TABLE collections ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_collections_archived_at ON collections(archived_at);

-- 3. Set default collection for existing users (Oldest Personal Collection)
WITH ranked_collections AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
  FROM collections
  WHERE owner_type = 'user'
)
UPDATE collections
SET is_default = TRUE
FROM ranked_collections
WHERE collections.id = ranked_collections.id AND ranked_collections.rn = 1;

=======================================================
`);
