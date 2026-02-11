-- Add archived_at column to collections table
ALTER TABLE collections ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Index for performance on filtering
CREATE INDEX idx_collections_archived_at ON collections(archived_at);
