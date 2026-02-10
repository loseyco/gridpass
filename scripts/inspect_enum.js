const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log('🔍 Inspecting Enum: classified_category');

    // We can't select * from pg_enum directly easily with JS client unless we have a view or rpc.
    // But we can try to insert a garbage value and catch the full error message which usually lists valid options.

    const { error } = await supabase
        .from('classifieds')
        .insert({
            title: 'Test Enum',
            category: 'INVALID_ENUM_VALUE_TO_TRIGGER_ERROR'
        });

    if (error) {
        console.log('🚨 Error Message (should contain valid enums):');
        console.log(error.message);
        console.log(error.details);
        console.log(error.hint);
    } else {
        console.log('❓ Surprisingly, it accepted the invalid value?');
    }
}

run();
