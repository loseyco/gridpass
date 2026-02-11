const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVisibility() {
    console.log('Fixing Collection Visibility...');

    // Update all default collections that are currently Public to be Private
    const { data, error } = await supabase
        .from('collections')
        .update({ visibility: 'Private' })
        .eq('is_default', true)
        .eq('visibility', 'Public')
        .select();

    if (error) {
        console.error('Error updating collections:', error);
        return;
    }

    console.log(`Successfully updated ${data.length} collections to Private.`);
    data.forEach(c => {
        console.log(`- Updated: "${c.name}" (${c.id})`);
    });
}

fixVisibility();
