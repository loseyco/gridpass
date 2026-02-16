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
    console.log('Fetching users...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('User Fetch Error:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.error('No users found.');
        return;
    }

    const user = users[0];
    console.log('Found user:', user.id, user.email);

    console.log('Attempting to upsert os_user_profiles...');
    const payload = {
        id: user.id,
        user_id: user.id,
        full_name: 'Script Verification Name'
    };

    const { data, error } = await supabase
        .from('os_user_profiles')
        .upsert(payload)
        .select();

    if (error) {
        console.error('Upsert Error:', error);
    } else {
        console.log('Success:', data);
    }
}

run();
