const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const migrationFile = path.join(__dirname, '../migrations/005_storage_bucket.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log(`Applying migration: 005_storage_bucket.sql`);

    // Split key into lines and execute (simplified, assuming no complex splitting needed for this specific file)
    // supabase-js doesn't have a direct "execute raw sql" method for admin without a specific function or RPC.
    // However, we can use the `postgres` package or similar if installed.
    // BUT, since we are in a rush and might not have `postgres` installed, 
    // we can try to use the Storage API directly to create the bucket if SQL fails or is hard to run.

    // Actually, easiest way to run SQL via supabase-js without an RPC is... difficult if not enabled.
    // Let's try to create the bucket via the Storage API client, which IS supported.

    console.log("Attempting to create bucket 'garage' via Storage API...");

    const { data, error } = await supabase
        .storage
        .createBucket('garage', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });

    if (error) {
        console.error('Error creating bucket:', error);
        if (error.message.includes('already exists')) {
            console.log('Bucket already exists.');
        }
    } else {
        console.log('Bucket created successfully:', data);
    }

    // Policies are harder to apply via API without SQL. 
    // If we can't run SQL, we might need to ask the user. 
    // BUT, if the user has the 'rpc' exposed or we can blindly hope they have a `exec_sql` function...
    // Let's assume for now we just create the bucket. The user can add policies in the dashboard if needed,
    // but public buckets often work for reading defaults. Writing might need policies.

    // Let's try to create the policies via... wait, we can't.
    // We will log that policies need to be added manually if we can't run SQL.

    console.log("\nIMPORTANT: RLS Policies cannot be applied via Storage API.");
    console.log("Please run 'migrations/005_storage_bucket.sql' in your Supabase SQL Editor to secure the bucket.");
}

applyMigration().catch(console.error);
