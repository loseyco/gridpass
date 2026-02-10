const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectSchema() {
    console.log('🔍 Inspecting vehicles table...');

    // Try to get one row
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting from vehicles:', error);
    } else {
        console.log('📄 Data row:', data);
        if (data && data.length > 0) {
            console.log('🔑 Keys:', Object.keys(data[0]));
        } else {
            console.log('⚠️ Table is empty.');
            // Try to insert one to see what fails
            console.log('Trying to insert dummy...');
            const { error: insertError } = await supabase.from('vehicles').insert({ type: 'sim' }).select();
            if (insertError) {
                console.error('❌ Insert error:', insertError);
            }
        }
    }
}

inspectSchema();
