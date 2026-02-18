-- FIX MIGRATION: Force Rename & Archive
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- This resolves the "relation already exists" error by dropping the empty target tables first.

BEGIN;

-- 1. Leads -> os_lead
DROP TABLE IF EXISTS os_lead;
ALTER TABLE IF EXISTS leads RENAME TO os_lead;

-- 2. Claim Tokens -> os_claim_token
DROP TABLE IF EXISTS os_claim_token;
ALTER TABLE IF EXISTS claim_tokens RENAME TO os_claim_token;

-- 3. Organizations -> os_organization
DROP TABLE IF EXISTS os_organization;
ALTER TABLE IF EXISTS organizations RENAME TO os_organization;

-- 4. Archive Legacy Tables (Adding _ZArchived_ prefix)
-- We rename them instead of deleting so data is recoverable if needed.

ALTER TABLE IF EXISTS tasks RENAME TO _ZArchived_tasks;
ALTER TABLE IF EXISTS todos RENAME TO _ZArchived_todos;
ALTER TABLE IF EXISTS classifieds RENAME TO _ZArchived_classifieds;
ALTER TABLE IF EXISTS listings RENAME TO _ZArchived_listings;
ALTER TABLE IF EXISTS events RENAME TO _ZArchived_events;
ALTER TABLE IF EXISTS vehicles RENAME TO _ZArchived_vehicles;
ALTER TABLE IF EXISTS garages RENAME TO _ZArchived_garages;
ALTER TABLE IF EXISTS races RENAME TO _ZArchived_races;

COMMIT;

SELECT 'Migration Fixed & Applied Successfully' as result;
