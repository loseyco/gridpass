-- RENAME TABLES TO 'OS_' STANDARD
-- Run this in your Supabase SQL Editor

-- 1. Leads -> os_lead
ALTER TABLE IF EXISTS leads RENAME TO os_lead;

-- 2. Claim Tokens -> os_claim_token
ALTER TABLE IF EXISTS claim_tokens RENAME TO os_claim_token;

-- 3. Organizations -> os_organization
ALTER TABLE IF EXISTS organizations RENAME TO os_organization;

-- 4. Archive old/unused tables (adding _ZArchived_ prefix)
ALTER TABLE IF EXISTS tasks RENAME TO _ZArchived_tasks;
ALTER TABLE IF EXISTS todos RENAME TO _ZArchived_todos;
ALTER TABLE IF EXISTS classifieds RENAME TO _ZArchived_classifieds;
ALTER TABLE IF EXISTS listings RENAME TO _ZArchived_listings;
ALTER TABLE IF EXISTS events RENAME TO _ZArchived_events;
ALTER TABLE IF EXISTS vehicles RENAME TO _ZArchived_vehicles;

-- 5. Fix references/policies (Optional but recommended)
-- If RLS policies referenced the old table names, they *should* auto-update in Postgres,
-- but standardizing column references (e.g. leads.id vs os_lead.id) inside policies might be needed manually if complex.
-- For now, the rename is the critical part.

SELECT 'Tables renamed successfully' as result;
