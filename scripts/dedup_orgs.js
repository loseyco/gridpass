
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Verify env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deduplicateOrgs() {
    console.log('Fetching organizations...');
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, type, created_at')
        .order('created_at', { ascending: true }); // Keep oldest?

    if (error) {
        console.error('Error fetching orgs:', error);
        return;
    }

    console.log(`Found ${orgs.length} organizations.`);

    const seen = new Map();
    const duplicates = [];

    orgs.forEach(org => {
        const key = `${org.name.toLowerCase()}|${org.type}`;
        if (seen.has(key)) {
            duplicates.push(org);
        } else {
            seen.set(key, org);
        }
    });

    console.log(`Found ${duplicates.length} duplicates.`);

    if (duplicates.length === 0) {
        console.log("No duplicates found to delete.");
        return;
    }

    console.log('Duplicates:', duplicates.map(d => `${d.name} (${d.type})`));

    // Delete duplicates
    const idsToDelete = duplicates.map(d => d.id);
    console.log(`Deleting ${idsToDelete.length} duplicates...`);

    const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Error deleting duplicates:', deleteError);
    } else {
        console.log('Successfully deleted duplicates.');
    }
}

deduplicateOrgs();
