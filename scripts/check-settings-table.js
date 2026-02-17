
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log('🔍 Checking for os_system_settings table...');

    const { data, error } = await supabase
        .from('os_system_settings')
        .select('*')
        .limit(1);

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.log('❌ Table os_system_settings does NOT exist.');
        } else {
            console.error('❌ Error:', error.message);
        }
    } else {
        console.log('✅ Table os_system_settings exists.');
        console.log('   Rows:', data);
    }
}

check();
