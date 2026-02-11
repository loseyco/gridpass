-- Add member_number column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_number BIGINT;

-- Backfill existing users
WITH ordered_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM profiles
)
UPDATE profiles
SET member_number = ordered_profiles.rn
FROM ordered_profiles
WHERE profiles.id = ordered_profiles.id
  AND profiles.member_number IS NULL;

-- Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS member_number_seq;

-- Set sequence to current max
SELECT setval('member_number_seq', COALESCE((SELECT MAX(member_number) FROM profiles), 0));

-- Set default value
ALTER TABLE profiles ALTER COLUMN member_number SET DEFAULT nextval('member_number_seq');

-- Add unique constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_member_number_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_member_number_key UNIQUE (member_number);
