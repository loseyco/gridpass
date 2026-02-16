const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users || users.length === 0) {
        console.error('No users found.');
        return;
    }
    const user = users[0];

    console.log('Attempting minimal upsert to discover columns...');
    const payload = {
        id: user.id,
        user_id: user.id
    };

    const { data, error } = await supabase
        .from('os_user_profiles')
        .upsert(payload)
        .select();

    if (error) {
        console.error('Upsert Error:', error);
    } else {
        console.log('Success. Columns found:', Object.keys(data[0]));
        console.log('Full Row:', data[0]);
    }
}

run();
