const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisibility() {
    console.log('Checking Collection Visibility...');

    const { data: collections, error } = await supabase
        .from('collections')
        .select('id, name, visibility, is_default, owner_type, owner_id');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${collections.length} collections.`);

    const publicDefaults = collections.filter(c => c.visibility === 'Public' && c.is_default);
    console.log(`\nFound ${publicDefaults.length} DEFAULT collections that are PUBLIC (potentially leaking):`);
    publicDefaults.forEach(c => {
        console.log(`- [${c.id}] "${c.name}" (Owner: ${c.owner_id})`);
    });

    const privateCollections = collections.filter(c => c.visibility === 'Private');
    console.log(`\nFound ${privateCollections.length} PRIVATE collections:`);
    privateCollections.forEach(c => {
        console.log(`- [${c.id}] "${c.name}"`);
    });
}

checkVisibility();
