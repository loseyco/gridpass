const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// We need to use the connection string for raw SQL execution
const connectionString = 'postgresql://postgres.bwpmqsdykumtfusflhri:gridpass2025!@db.bwpmqsdykumtfusflhri.supabase.co:5432/postgres';

async function applyMigration() {
    const pool = new Pool({ connectionString });

    console.log('📊 Applying pre-auth payment support migration...\n');

    const queries = [
        {
            name: 'Add user_id column',
            sql: `ALTER TABLE resume_leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;`
        },
        {
            name: 'Add stripe_payment_intent_id column',
            sql: `ALTER TABLE resume_leads ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;`
        },
        {
            name: 'Drop old payment_status constraint',
            sql: `ALTER TABLE resume_leads DROP CONSTRAINT IF EXISTS resume_leads_payment_status_check;`
        },
        {
            name: 'Add new payment_status constraint',
            sql: `ALTER TABLE resume_leads ADD CONSTRAINT resume_leads_payment_status_check CHECK (payment_status IN ('unpaid', 'authorized', 'paid', 'refunded', 'failed'));`
        },
        {
            name: 'Add user_id index',
            sql: `CREATE INDEX IF NOT EXISTS idx_resume_leads_user_id ON resume_leads(user_id);`
        },
        {
            name: 'Add payment_intent index',
            sql: `CREATE INDEX IF NOT EXISTS idx_resume_leads_payment_intent ON resume_leads(stripe_payment_intent_id);`
        }
    ];

    try {
        for (const query of queries) {
            console.log(`  Running: ${query.name}...`);
            try {
                await pool.query(query.sql);
                console.log(`  ✅ Success`);
            } catch (error) {
                console.error(`  ❌ Error: ${error.message}`);
            }
        }
        console.log('\n✅ Migration complete!');
    } finally {
        await pool.end();
    }
}

applyMigration().catch(console.error);
